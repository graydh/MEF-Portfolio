# MEF Portfolio Visualization

*a full-stack data visualization built with Flask and D3*

This visualization presents the current holdings and associated equity prices for the Minutemen Equity Fund's Portfolio.
The outer donut displays the breakdown by sector value weight, while the inner displays the value breakdown of the equitys covered by the currently selected sector.
Selections are apparent through black outlines on the slice. A sector and equity pairing are always defined to create rectangle key display.


### Live deployment:

[personal Heroku](http://mef-portfolio.herokuapp.com/) Owner:  dgraymullen@umass.edu

### Running the project:
1. Install Python (3.9+)
2. Signup for Alpaca API
3. Get Alpaca API Key + Secret under PaperTrading
4. set two environment variables as described [here](https://github.com/alpacahq/alpaca-trade-api-python/blob/master/README.md) under 'Alpaca Environment Variables'
5. install package dependencies with pip
6. in terminal: python3 application.py
