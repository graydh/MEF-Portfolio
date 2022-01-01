import tabloo
import pandas as pd

if __name__ == '__main__':
    df = pd.read_pickle("holdings")
    tabloo.show(df)