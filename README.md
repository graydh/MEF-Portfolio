Running the Project:

1. Install Python (3.9+)
2. Install PyCharm Community (recommended)
3. Signup for Alpaca API
4. Get Alpaca API Key + Secret under PaperTrading
5. Open the Project File in PyCharm (for Github Desktop default location is /{current_user}/Documents/Github)
6. In the top left of PyCharm select 'Add Configuration'
    6a. Under templates select Python, set 'script path' to point to 'application.py'
    6b. Click the small box icon under "Environment Variables" and another window should pop up
    6c. In that window click the plus to add an environment variable. Enter 2 variables as described [here](https://github.com/alpacahq/alpaca-trade-api-python/blob/master/README.md) under 'Alpaca Environment Variables'
    6d. you will also need to create a 'Python interpreter', using default is fine
7. double click on requirements.txt to open it in PyCharm, there should be an automatic notification to install the packages
8. click the green arrow in the top left while you have the configuration you created selected
9. view the website at the localhost address printed in the console at the bottom
