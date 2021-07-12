import csv
import datetime
import copy
import alpaca_trade_api.rest

lastCSV = {"time": None, "dict": None}

api = alpaca_trade_api.rest.REST()

def processCSV():
    data = {}
    with open("static/archiveHoldings.csv", newline='\n') as csvFile: #TODO - refactor to retrieve remotely from drive, maybe sheets
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
                elif col == "avg_cost" or col == "quantity" or col == "total_cost" or col == "market_value" or col == "last_price":
                    equity[col] = float(equity[col].replace(',', ''))
            if sector != "Cash":
                equity["avg_cost"] = round((equity["total_cost"] / equity["quantity"]), 2)
    return data

def generateNewDictionary():
    visualDataArray = [] #each index is moment in visualization time or 'tick' on dynamic chart

    equityData = processCSV() #extract holdings info from CSV

    query = [] #Symbol query for Alpaca
    for sector in equityData.keys():
        for equity in equityData[sector]:
            query.append(equity["symbol"])

    print("Querying Alpaca...")

    ticks = 1
    barsetFrame = api.get_barset(query, "day", limit=ticks)  #{'AAPL': [Bar({   'c': 116.4, 'h': 121, 'l': 116.21, 'o': 120.93, 't': 1615179600, 'v': 141360327})], etc}

    for i in range(ticks):
        for sector in equityData.keys():
            sectorSum = 0
            for k in range(len(equityData[sector])):
                bar = barsetFrame[equityData[sector][k]['symbol']]
                if(len(bar) > 0):
                    equityData[sector][k]['last_price'] = float(bar[i].c)
                    equityData[sector][k]['market_value'] = equityData[sector][k]['last_price'] * equityData[sector][k]['quantity']
                sectorSum += equityData[sector][k]['market_value']
            for k in range(len(equityData[sector])):
                equityData[sector][k]['pct'] = equityData[sector][k]['market_value'] / sectorSum
        visualDataArray.append(copy.deepcopy(equityData))

    #TODO - refactor to single data model
    #generate data By sector for outer ring
    sectorData = []
    schema = ["sector", "value", "pct"]
    portfolioSum = 0
    sectorSums = {}
    for sector in equityData.keys():
        sectorsum = 0
        for equity in equityData[sector]:
            sectorsum += equity["market_value"]
        sectorSums[sector] = sectorsum
        portfolioSum += sectorsum
    for sector in equityData.keys():
        row = {schema[0]: sector, schema[1]: sectorSums[sector], schema[2]: float(sectorSums[sector]/portfolioSum)}
        sectorData.append(row.copy())

    data = {"bySector": sectorData, "byEquity": visualDataArray}
    return data

def portfolioDictionary():
    if lastCSV["time"] == None:
        lastCSV["time"] = datetime.datetime.now()
        lastCSV["dict"] = generateNewDictionary()
    elif datetime.datetime.now() - lastCSV["time"] > datetime.timedelta(minutes=4):
        lastCSV["time"] = datetime.datetime.now()
        lastCSV["dict"] = generateNewDictionary()
    return lastCSV["dict"]