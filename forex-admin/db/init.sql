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
    lastUpdated DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT uniquePair UNIQUE (fromCurrency, toCurrency),
    foreign KEY (fromCurrency) REFERENCES forexReserves(id),
    foreign KEY (toCurrency) REFERENCES forexReserves(id)
);
GO

CREATE TABLE transactionLedger (
    id INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,
    transactionDate DATETIME NOT NULL DEFAULT GETDATE(),
    exchangePair INT NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    exchangeRate DECIMAL(18, 6) NOT NULL,
    FOREIGN KEY (exchangePair) REFERENCES exchangeablePairs(id),
);
GO

INSERT INTO forexReserves (id, currency, amount) VALUES
(1, 'USD', 1000000000.00),
(2, 'EUR', 900000000.00),
(3, 'GBP', 800000000.00),
(4, 'JPY', 120000000000.00),
(5, 'CHF', 700000000.00),
(6, 'CAD', 650000000.00),
(7, 'AUD', 600000000.00),
(8, 'NZD', 550000000.00),
(9, 'INR', 30000000000.00);  
GO

INSERT INTO exchangeablePairs (id, fromCurrency, toCurrency, exchangeRate) VALUES
(1, 1, 2, 1.085000),    -- USD/EUR
(2, 1, 3, 1.265000),    -- USD/GBP
(3, 1, 4, 151.200000),  -- USD/JPY
(4, 1, 5, 0.905000),    -- USD/CHF
(5, 1, 6, 1.370000),    -- USD/CAD
(6, 1, 7, 1.600000),    -- USD/AUD
(7, 1, 8, 1.660000),    -- USD/NZD
(8, 2, 3, 0.865000),    -- EUR/GBP
(9, 2, 4, 164.000000),  -- EUR/JPY
(10, 2, 5, 0.990000),   -- EUR/CHF
(11, 2, 6, 1.475000),   -- EUR/CAD
(12, 2, 7, 1.750000),   -- EUR/AUD
(13, 3, 4, 193.200000), -- GBP/JPY
(14, 3, 5, 1.130000),   -- GBP/CHF
(15, 3, 6, 1.635000),   -- GBP/CAD
(16, 4, 5, 0.006650),   -- JPY/CHF
(17, 4, 6, 0.008950),   -- JPY/CAD
(18, 5, 6, 1.520000),   -- CHF/CAD
(19, 7, 2, 0.654000),   -- AUD/EUR
(20, 8, 2, 0.610000),   -- NZD/EUR
(21, 7, 6, 0.915000),   -- AUD/CAD
(22, 7, 8, 1.080000),   -- AUD/NZD
(23, 8, 6, 0.870000),   -- NZD/CAD
(24, 7, 4, 95.000000),  -- AUD/JPY
(25, 8, 4, 88.500000),  -- NZD/JPY
(26, 5, 7, 1.760000),   -- CHF/AUD
(27, 1, 9, 83.250000),  -- USD/INR
(28, 2, 9, 89.500000),  -- EUR/INR
(29, 3, 9, 105.300000), -- GBP/INR
(30, 5, 9, 92.600000),  -- CHF/INR
(31, 9, 1, 0.012000),   -- INR/USD
(32, 9, 2, 0.011200),   -- INR/EUR
(33, 9, 3, 0.009500),   -- INR/GBP
(34, 9, 4, 1.200000),   -- INR/JPY
(35, 9, 5, 0.010800),   -- INR/CHF
(36, 9, 6, 0.016000),   -- INR/CAD
(37, 9, 7, 0.018000),   -- INR/AUD
(38, 9, 8, 0.020000);   -- INR/NZD
GO