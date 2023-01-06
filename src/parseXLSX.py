import pandas as pd
from collections import defaultdict
import random
from alpaca_trade_api.rest import REST, TimeFrame, TimeFrameUnit
import datetime


random.seed(1e3)

last_fetch = {'time': None, 'dict': None}
api = REST()

sheet_key = '1U7Qo5-pGE96q_WOr4UzsyERdQqbtKkQBSiutZ2cnvXw'

# processes the main detailed data for the chart
def process_sheet():
    df = pd.read_csv('https://docs.google.com/spreadsheets/d/' + sheet_key + '/gviz/tq?tqx=out:csv&sheet=holdings')
    df = df.astype({'Quantity': 'float', 'Adjusted Cost ($)': 'float'})
    # update prices for stocks - add 'Last ($)' and 'Market Value ($)' using 'Quantity'
    is_stock = df['Product Type'] == 'Stock'
    stock = df[is_stock]
    print(len(list(stock['Symbol'])))
    bar = api.get_bars(list(stock['Symbol']), TimeFrame(23, TimeFrameUnit.Hour), adjustment='raw', limit=100)
    print(len(bar))
    # TODO assert same length before & after?
    bar_df = pd.DataFrame(data={'Symbol': [o.S for o in bar], 'Last ($)': [o.c for o in bar]})

    stock = bar_df.set_index('Symbol').combine_first(stock.set_index('Symbol')) # TODO combine_first is not the right method
    stock = stock.reset_index()

    stock['Market Value ($)'] = stock['Last ($)'] * stock['Quantity']


    non_stock = df[[not e for e in is_stock]]
    non_stock = non_stock.reset_index()
    non_stock['Market Value ($)'] = non_stock['Adjusted Cost ($)']

    df = pd.concat([stock, non_stock])

    df.sort_values("Market Value ($)", inplace=True, ascending=False)
    df = df.fillna('')  # js not happy about NaN

    # group by sector with equity objects (convert tuples to dicts)
    df['dict'] = df[list(df.columns)].to_dict("records")
    dict_df = df[['Sector', 'dict']]
    df.drop(labels='dict', axis=1)
    dict_df = dict_df.groupby('Sector')['dict'].apply(list)
    detailed = dict_df.to_dict()

    date_update, default_sector = update_settings()
    return detailed, date_update, default_sector


def update_settings():
    df = pd.read_csv('https://docs.google.com/spreadsheets/d/' + sheet_key + '/gviz/tq?tqx=out:csv&sheet=chart_settings')
    date_str = df['Last Updated'][0]
    default_sector_str = df['Default Sector'][0]
    return date_str, default_sector_str


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

    #random.shuffle(sector_data) # to avoid small sections next to each other

    return sector_data


# splits the detailed df into data structured for the chart
def into_d3_dict(tuple_param):
    detailed, as_of_date, default_sector = tuple_param
    return {"byEquity": detailed, "bySector": by_sector(detailed), "as_of_date": as_of_date, "default_sector": default_sector}


# avoids fetching more than every minute
def fetch():
    global last_fetch
    t = last_fetch['time']
    if (t is None) or ((datetime.datetime.now() - t) > datetime.timedelta(minutes=1)):
        last_fetch = {'time': datetime.datetime.now(), 'dict': into_d3_dict(process_sheet())}
    return last_fetch["dict"]
