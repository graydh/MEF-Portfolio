import datetime
import pandas as pd
from collections import defaultdict
import random
from alpaca_trade_api.rest import REST

random.seed(1e3)

last_fetch = {'time': None, 'dict': None}
api = REST()

# processes the main detailed data for the chart
def process_pickle():
    df = pd.read_pickle("db/holdings")

    # hard-codes here
    df.set_index('Symbol', inplace=True)

    df.at['SUM', 'Sector'] = 'Industrials'
    df.at['HRC', 'Sector'] = 'Healthcare'
    df.at['TGP', 'Sector'] = 'Utilities'

    df.reset_index(inplace=True)


    # update prices for stocks - replace 'Last ($)' and 'Market Value ($)' using 'Quantity'
    is_stock = df['Product Type'] == 'Stocks / Options'
    stock = df[is_stock]

    bar = api.get_barset(list(stock['Symbol']), 'day', limit=1)
    bar_df = pd.DataFrame(data={'Symbol': bar.keys(), 'Last ($)': [o[0].c for o in bar.values()]})
    stock = stock.drop('Last ($)', axis=1)
    stock = stock.join(bar_df.set_index('Symbol'), on='Symbol')
    stock['Market Value ($)'] = stock['Last ($)'] * stock['Quantity']

    non_stock = df[[not e for e in is_stock]]
    df = pd.concat([stock, non_stock])

    as_of_date = df["As Of"].mode()[0]
    print(as_of_date)

    df = df.fillna('')  # js not happy about NaN
    print(df.to_string())
    df.sort_values("Market Value ($)", inplace=True, ascending=False)

    # group by sector with equity objects (convert tuples to dicts)
    df['dict'] = df[list(df.columns)].to_dict("records")
    dict_df = df[['Sector', 'dict']]
    df.drop(labels='dict', axis=1)
    dict_df = dict_df.groupby('Sector')['dict'].apply(list)
    detailed = dict_df.to_dict()

    return detailed, as_of_date


# produces the outer ring data for the chart
def by_sector(detailed):
    sector_sums = defaultdict(lambda: 0)
    for sector in detailed.keys():
        for equity in detailed[sector]:
            sector_sums[sector] += equity["Market Value ($)"]
    portfolio_sum = sum(sector_sums.values())

    sector_data = []
    for sector in sector_sums.keys():
        row = {'sector': sector, 'value': sector_sums[sector], 'pct': float(sector_sums[sector] / portfolio_sum)}
        sector_data.append(row)

    random.shuffle(sector_data)     # to avoid small sections next to each other

    return sector_data


# splits the detailed df into data structured for the chart
def into_d3_dict(tuple_param):
    detailed, as_of_date = tuple_param
    return {"byEquity": detailed, "bySector": by_sector(detailed), "as_of_date": as_of_date}


# avoids fetching more than every 5 minutes
def portfolio_dictionary():
    global last_fetch
    t = last_fetch['time']
    if (t is None) or ((datetime.datetime.now() - t) > datetime.timedelta(minutes=5)):
        last_fetch = {'time': datetime.datetime.now(), 'dict': into_d3_dict(process_pickle())}
    return last_fetch["dict"]
