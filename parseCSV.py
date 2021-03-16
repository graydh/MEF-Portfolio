import csv
import datetime
import alpaca_trade_api.rest

lastCSV = {"time": None, "dict": None}

api = alpaca_trade_api.rest.REST()

#All data preprocessing

def processCSV():
    data = {}
    with open("static/archiveHoldings.csv", newline='\n') as csvFile:
        columns = ['asset_type', 'name', 'open_order', 'symbol', 'CUSIP', 'last_price', 'as_of', 'quantity', 'market_value',
                   'today_pct_change', 'today_price_change', 'total_cost', 'adjusted_cost', 'unrealized_gain_pct',
                   'unrealized_gain_price', 'accrued_interest', 'dividend', 'yield', 'maturity_date', 'pct_portfolio',
                   'coupon_rate', 'cum_payout', 'annual_income', 'moody_rating', 'net_value_pct', 'net_value_price',
                   'price_change_pct', 'price_change_price', 'prior_close_total', 'prior_close_each', 'close_date',
                   'S&P_rating', 'purchases', 'ex-dividend_date', 'sector']
        includes = ['asset_type', 'name', 'symbol', 'last_price', 'as_of', 'quantity', 'market_value', 'total_cost', 'sector', None]

        reader = csv.DictReader(csvFile, fieldnames=columns)
        for row in reader:
            if row['asset_type'][:5] == 'Stock' or row['asset_type'][:4] == 'Cash':
                if row['sector'] not in data:
                    data[row['sector']] = []
                data[row['sector']].append(row.copy())
    for sector in data.keys():
        for equity in data[sector]:
            equity.pop(None)
            for col in columns:
                if (col not in includes) or equity[col] == "-":
                    equity.pop(col)
                elif col == "avg_cost" or col == "quantity" or col == "total_cost" or col == "market_value":
                    equity[col] = float(equity[col].replace(',', ''))

            if sector != "Cash":
                equity["avg_cost"] = round((equity["total_cost"] / equity["quantity"]), 2)
    return data

def generateNewDictionary():
    data = processCSV()
    query = []
    for sector in data.keys():
        for equity in data[sector]:
            query.append(equity["symbol"])

    print("Querying Alpaca...")
    #Alpaca Historical Data Query
    barsetFrame = api.get_barset(query, "day", limit=1)
    #{'AAPL': [Bar({   'c': 116.4, 'h': 121, 'l': 116.21, 'o': 120.93, 't': 1615179600, 'v': 141360327})], etc}

    for sector in data.keys():
        for equity in data[sector]:
            bar = barsetFrame[equity['symbol']]
            if(len(bar) > 0):
                equity['last_price'] = bar[0].c
                equity['as_of'] = str(datetime.date.today() - datetime.timedelta(days=1))
    return data

def portfolioDictionary():
    if lastCSV["time"] == None:
        lastCSV["time"] = datetime.datetime.now()
        lastCSV["dict"] = generateNewDictionary()
    elif datetime.datetime.now() - lastCSV["time"] > datetime.timedelta(minutes=4):
        lastCSV["time"] = datetime.datetime.now()
        lastCSV["dict"] = generateNewDictionary()
    return lastCSV["dict"]




