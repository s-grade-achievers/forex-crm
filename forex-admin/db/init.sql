CREATE DATABASE TestDB;
GO

USE TestDB;
GO

CREATE TABLE forexReserves (
    id INT PRIMARY KEY,
    currency NVARCHAR(3) NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
);
GO

CREATE TABLE exchangeablePairs (
    id INT PRIMARY KEY,
    fromCurrency INT NOT NULL,
    toCurrency INT NOT NULL,
    exchangeRate DECIMAL(18, 6) NOT NULL,
    lastUpdated DATETIME NOT NULL,
    foreign KEY (fromCurrency) REFERENCES forexReserves(id),
    foreign KEY (toCurrency) REFERENCES forexReserves(id)
)

CREATE TABLE transactionLedger (
    id INT PRIMARY KEY,
    userId INT NOT NULL,
    transactionDate DATETIME NOT NULL,
    exchangePair INT NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    exchangeRate DECIMAL(18, 6) NOT NULL,
    FOREIGN KEY (exchangePair) REFERENCES exchangeablePairs(id),
);
GO