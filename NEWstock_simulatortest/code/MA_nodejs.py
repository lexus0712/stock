from backtesting import Backtest, Strategy
from backtesting.lib import crossover

from FinMind.data import DataLoader
import pandas as pd

import talib
from talib import abstract
import matplotlib.pyplot as plt
import sys
# 取得資料
dl = DataLoader()
df = dl.taiwan_stock_daily(
    stock_id=sys.argv[1], start_date=sys.argv[2], end_date=sys.argv[3])
# 整理資料格式
df = df.rename(columns={"date": "Date"})
df.set_index("Date", inplace=True)
df = df.set_index(pd.DatetimeIndex(pd.to_datetime(df.index)))
# backtesting.py 格式
df1 = df.rename(columns={"open": "Open", "max": "High",
                "min": "Low", "close": "Close", "Trading_Volume": "Volume"})
# ta-lib 格式
df2 = df.rename(columns={"max": "high", "min": "low",
                "Trading_Volume": "Volume"})
# 合併資料
df = pd.merge(df1, df, on="Date")


def SMA30(data):  # Data is going to be our OHLCV
    # 取得SMA值
    df2['SMA30'] = talib.SMA(df2['close'], timeperiod=int(sys.argv[4]))
    return df2['SMA30']


def EMA30(data):  # Data is going to be our OHLCV
    # 取得EMA值
    df2['EMA30'] = talib.EMA(df2['close'], timeperiod=int(sys.argv[5]))
    return df2['EMA30']


def WMA30(data):  # Data is going to be our OHLCV
    # 取得WMA值
    df2['WMA30'] = talib.WMA(df2['close'], timeperiod=int(sys.argv[6]))
    return df2['WMA30']

# MA 策略
class MAStra(Strategy):
    def init(self):
        self.I(SMA30, self.data)
        self.I(EMA30, self.data)
        self.I(WMA30, self.data)

    def next(self):
        pass


bt = Backtest(df, MAStra, cash=10000, commission=.001798)  # 交易成本 0.1798%
output = bt.run()
print(output)
bt.plot()
