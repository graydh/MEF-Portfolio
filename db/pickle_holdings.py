# generating the sectors automatically takes a long time (~1 sec per equity. thanks yahoo -_- )
# run this separate script to add sector column when we want to change chart content (holdings.xlsx -> holdings.pkl)
import pandas as pd
import yfinance as yf


def merge_row(df, idx_to_add_to, row_to_add, cols_to_merge):
    for col_name in cols_to_merge:
        val_add = row_to_add[col_name]
        orig = df.at[idx_to_add_to, col_name]
        if type(val_add) is not None and type(orig) is not None:
            df.at[idx_to_add_to, col_name] = (val_add + orig)


# process xlsx into df
def get_df(filepath="holdings.xlsx"):
    # primary key of df
    prim_key = "Symbol"
    # keep columns
    keeps = [prim_key, "Product Type", "Name", "Market Value ($)", "Quantity", "Last ($)", "Adjusted Cost ($)", "As Of"]
    # reads from filepath in cwd, column labels included, force primary key
    df = pd.read_excel(filepath, header=1, na_values="-", usecols=keeps).drop_duplicates(prim_key)
    df["As Of"].fillna(df["As Of"].mode()[0], inplace=True)
    # merge pending transaction costs in if they exist
    clearing = df[df["Symbol"] == "CLER"]
    df.drop(clearing.index, inplace=True)
    col_to_merge = ["Market Value ($)"]
    cash_idx = df[df["Symbol"] == "BDPS"].index[0]
    merge_row(df, cash_idx, clearing, col_to_merge)

    return df

# use yfinance to auto grab sector labels
def add_sector_labels(df, label):
    df.sort_values(by=["Product Type"], inplace=True, ascending=False)  # any non-equity belongs to Cash sector
    sectors = []

    # EQUITIES
    is_equity = df["Product Type"].eq("Stocks / Options")
    ticker_list = list(df["Symbol"][is_equity])
    infos = yf.Tickers(ticker_list)
    for ticker in infos.tickers.keys():
        print("Determining sector for:", ticker)
        try:
            sector = str(infos.tickers[ticker].info['sector'])
        except KeyError:
            sector = "UNKNOWN"


        print(ticker, "is", sector)
        sectors.append(sector)

    sectors = condense_sector_aliases(sectors)

    # CASH - all non-equity holdings
    is_cash = [not e for e in is_equity]

    df[label] = sectors + ["Cash" for i in range(sum(is_cash))]

    return df

def condense_sector_aliases(sectors):
    return list(map(lambda a: 'Technology' if (a == 'Communication Services') else a, sectors))

if __name__=='__main__':
    df = get_df()
    df = add_sector_labels(df, "Sector")
    df.to_pickle("holdings")

