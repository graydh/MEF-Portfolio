import pandas as pd
from collections import defaultdict
import random
from alpaca_trade_api.rest import REST, TimeFrame, TimeFrameUnit
import datetime

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
    print(len(list(stock['Symbol'])))
    date_today = datetime.datetime.today().strftime('%Y-%m-%d')
    bar = api.get_bars(list(stock['Symbol']), TimeFrame(8, TimeFrameUnit.Hour), adjustment='raw', limit=100)
    print(len(bar))     # TODO not all stocks getting returned?
    bar_df = pd.DataFrame(data={'Symbol': [o.S for o in bar], 'Last ($)': [o.c for o in bar]})

    stock = bar_df.set_index('Symbol').combine_first(stock.set_index('Symbol'))
    stock = stock.reset_index()

    stock['Market Value ($)'] = stock['Last ($)'] * stock['Quantity']

    non_stock = df[[not e for e in is_stock]]
    df = pd.concat([stock, non_stock])

    as_of_date = df["As Of"].mode()[0]
    print(as_of_date)

    df.sort_values("Market Value ($)", inplace=True, ascending=False)
    df = df.fillna('')  # js not happy about NaN

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
        print(last_fetch)
    return last_fetch["dict"]
