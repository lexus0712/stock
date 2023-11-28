from backtesting import Backtest, Strategy
from backtesting.lib import crossover

from FinMind.data import DataLoader
import pandas as pd

import talib
from talib import abstract
import sys
# 取得資料
dl = DataLoader()
df = dl.taiwan_stock_daily(
    stock_id=sys.argv[1], start_date=sys.argv[2], end_date=sys.argv[3])
# 整理資料格式
df = df.rename(columns={"date": "Date"})
df.set_index("Date", inplace=True)
df = df.set_index(pd.DatetimeIndex(pd.to_datetime(df.index)))

# 重新取樣為五日資料
days='20D'
df = df.resample(days).agg({
    'Trading_Volume': 'sum',
    'Trading_money': 'sum',
    'open': 'first',    # 開盤價使用第一天的值
    'max': 'max',       # 最高價使用五天內的最大值
    'min': 'min',       # 最低價使用五天內的最小值
    'close': 'last',    # 收盤價使用最後一天的值
    'spread': 'last',   # spread 使用最後一天的值
    'Trading_turnover': 'sum'
})

# 移除包含NaN值的列
df = df.dropna()

# 打印合併後的資料
print(df)



# backtesting.py 格式
df1 = df.rename(
    columns={
        "open": "Open",
        "max": "High",
        "min": "Low",
        "close": "Close",
        "Trading_Volume": "Volume",
    }
)

# ta-lib 格式
df2 = df.rename(columns={"max": "high", "min": "low", "Trading_Volume": "Volume"})
# 取得 KD 值
df_kd = abstract.STOCH(df2, fastk_period=int(sys.argv[4]), slowk_period=int(sys.argv[5]), slowd_period=int(sys.argv[6]))
# 合併資料
df1 = pd.merge(df1, df_kd, on="Date")


def STOCH(data):
    # Data is going to be our OHLCV
    df_kd = abstract.STOCH(df2, fastk_period=int(sys.argv[4]), slowk_period=int(sys.argv[5]), slowd_period=int(sys.argv[6]))
    return df_kd


# KD 策略
class KdCross(Strategy):
    def init(self):
        self.I(STOCH, self.data)

    def next(self):
        if crossover(20, self.data.slowk):  # K<20 買進
            self.buy()
        elif crossover(self.data.slowk, 80):  # K>80 平倉
            self.position.close()


bt = Backtest(df1, KdCross, cash=10000, commission=.001798)  # 交易成本 0.1798%
output = bt.run()
print(output)
bt.plot()
