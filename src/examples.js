// Example ledger files for the playground

/** @typedef {'simple' | 'stocks' | 'crypto' | 'travel' | 'business' | 'errors' | 'beancount'} ExampleName */

/** @type {Record<ExampleName, string>} */
export const examples = {
    simple: `; === Your First Month with Beancount ===
; Track where your money actually goes.
; Edit this file - changes validate instantly!

option "title" "January 2024"
plugin "noduplicates"

; Step 1: Open your accounts
2024-01-01 open Assets:BofA:Checking        USD
2024-01-01 open Assets:Venmo                USD
2024-01-01 open Liabilities:Amex            USD
2024-01-01 open Expenses:Rent               USD
2024-01-01 open Expenses:Food:Groceries     USD
2024-01-01 open Expenses:Food:Restaurants   USD
2024-01-01 open Expenses:Subscriptions      USD
2024-01-01 open Income:Salary               USD
2024-01-01 open Equity:Opening              USD

; Step 2: Starting balances (from your statements)
2024-01-01 * "Starting balance"
    Assets:BofA:Checking            4250.00 USD
    Assets:Venmo                     340.00 USD
    Liabilities:Amex               -1200.00 USD  ; you owe this
    Equity:Opening

; Step 3: Record transactions as they happen
2024-01-02 * "Landlord" "January rent"
    Expenses:Rent                   1800.00 USD
    Assets:BofA:Checking

2024-01-05 * "Spotify"
    Expenses:Subscriptions            10.99 USD
    Liabilities:Amex

2024-01-05 * "Netflix"
    Expenses:Subscriptions            15.99 USD
    Liabilities:Amex

2024-01-08 * "Trader Joe's"
    Expenses:Food:Groceries           67.34 USD
    Liabilities:Amex

2024-01-12 * "Chipotle" "Lunch with coworkers"
    Expenses:Food:Restaurants         14.50 USD
    Assets:Venmo

2024-01-15 * "Employer" "Paycheck - take home"
    Assets:BofA:Checking            3450.00 USD
    Income:Salary

2024-01-18 * "Pay Amex bill"
    Liabilities:Amex                1294.32 USD
    Assets:BofA:Checking

; Step 4: Reconcile with your statements
2024-01-31 balance Assets:BofA:Checking     4605.68 USD
2024-01-31 balance Liabilities:Amex            0.00 USD`,

    stocks: `; === Stock Portfolio Tracking ===
; Track investments, dividends, and gains

option "title" "Investment Portfolio"
option "operating_currency" "USD"
plugin "implicit_prices"
plugin "noduplicates"

2024-01-01 open Assets:Brokerage:Cash        USD
2024-01-01 open Assets:Brokerage:Stocks      USD
2024-01-01 open Income:Dividends             USD
2024-01-01 open Income:Capital-Gains         USD
2024-01-01 open Expenses:Fees                USD
2024-01-01 open Equity:Opening               USD

; Initial deposit
2024-01-02 * "Transfer" "Fund brokerage"
    Assets:Brokerage:Cash            10000.00 USD
    Equity:Opening

; Buy Apple shares (25 shares @ $185.50)
2024-01-15 * "Buy AAPL" "25 shares"
    Assets:Brokerage:Stocks           4637.50 USD
    Expenses:Fees                        4.95 USD
    Assets:Brokerage:Cash

; Buy VTI index fund (20 shares @ $240)
2024-01-15 * "Buy VTI" "20 shares"
    Assets:Brokerage:Stocks           4800.00 USD
    Assets:Brokerage:Cash

; Dividend received
2024-02-15 * "AAPL Dividend"
    Assets:Brokerage:Cash                6.00 USD
    Income:Dividends

; Sell Apple shares at a gain
2024-03-01 * "Sell AAPL" "10 shares @ $196"
    Assets:Brokerage:Cash             1960.00 USD
    Assets:Brokerage:Stocks          -1855.00 USD
    Income:Capital-Gains              -105.00 USD

2024-03-31 balance Assets:Brokerage:Cash    2523.55 USD
2024-03-31 balance Assets:Brokerage:Stocks  7582.50 USD`,

    crypto: `; === Cryptocurrency Portfolio ===
; Track crypto investments in USD value

option "title" "Crypto Holdings"
option "operating_currency" "USD"
plugin "implicit_prices"
plugin "noduplicates"

2024-01-01 open Assets:Coinbase:Cash        USD
2024-01-01 open Assets:Coinbase:Crypto      USD
2024-01-01 open Assets:Ledger:Crypto        USD
2024-01-01 open Expenses:Fees:Trading       USD
2024-01-01 open Expenses:Fees:Network       USD
2024-01-01 open Income:Capital-Gains        USD
2024-01-01 open Equity:Opening              USD

; Deposit USD
2024-01-05 * "ACH Transfer"
    Assets:Coinbase:Cash             5000.00 USD
    Equity:Opening

; Buy Bitcoin (0.05 BTC @ $42,500)
2024-01-10 * "Buy BTC" "0.05 BTC"
    Assets:Coinbase:Crypto           2125.00 USD
    Expenses:Fees:Trading              10.00 USD
    Assets:Coinbase:Cash

; Buy Ethereum (1 ETH @ $2,200)
2024-01-10 * "Buy ETH" "1 ETH"
    Assets:Coinbase:Crypto           2200.00 USD
    Expenses:Fees:Trading               5.50 USD
    Assets:Coinbase:Cash

; Transfer to hardware wallet
2024-01-20 * "Transfer to Ledger" "0.049 BTC"
    Assets:Ledger:Crypto             2082.75 USD
    Expenses:Fees:Network              42.50 USD
    Assets:Coinbase:Crypto

; Sell some ETH at profit
2024-03-01 * "Sell ETH" "0.5 ETH @ $3,200"
    Assets:Coinbase:Cash             1600.00 USD
    Assets:Coinbase:Crypto          -1100.00 USD
    Income:Capital-Gains             -500.00 USD

2024-03-31 balance Assets:Coinbase:Cash     2259.50 USD
2024-03-31 balance Assets:Coinbase:Crypto   1099.75 USD
2024-03-31 balance Assets:Ledger:Crypto     2082.75 USD`,

    travel: `; === Travel Expense Tracking ===
; Track trip expenses in USD

option "title" "Japan Trip 2024"
option "operating_currency" "USD"
plugin "noduplicates"
plugin "leafonly"

2024-01-01 open Assets:Checking             USD
2024-01-01 open Assets:Cash                 USD
2024-01-01 open Liabilities:CreditCard      USD
2024-01-01 open Expenses:Travel:Flights     USD
2024-01-01 open Expenses:Travel:Hotels      USD
2024-01-01 open Expenses:Travel:Food        USD
2024-01-01 open Expenses:Travel:Transport   USD
2024-01-01 open Expenses:Travel:Activities  USD
2024-01-01 open Equity:Opening              USD

; Book flights (2 months before)
2024-01-15 * "United Airlines" "SFO-NRT roundtrip"
    Expenses:Travel:Flights         1200.00 USD
    Liabilities:CreditCard

; Book hotel
2024-02-01 * "Shinjuku Hotel" "7 nights"
    Expenses:Travel:Hotels           980.00 USD
    Liabilities:CreditCard

; Withdraw cash for trip
2024-03-10 * "ATM Withdrawal" "Travel cash"
    Assets:Cash                     1000.00 USD
    Assets:Checking

; Daily expenses in Japan (converted to USD)
2024-03-15 * "Ramen shop" "Dinner in Shibuya"
    Expenses:Travel:Food               8.40 USD
    Assets:Cash

2024-03-15 * "JR Pass" "7-day rail pass"
    Expenses:Travel:Transport        207.55 USD
    Assets:Cash

2024-03-16 * "TeamLab" "Digital art museum"
    Expenses:Travel:Activities        22.40 USD
    Assets:Cash

2024-03-16 * "Sushi restaurant"
    Expenses:Travel:Food              31.50 USD
    Assets:Cash

2024-03-31 balance Assets:Cash              730.15 USD
2024-03-31 balance Liabilities:CreditCard -2180.00 USD`,

    business: `; === Freelance Business ===
; Track income, expenses, and quarterly taxes

option "title" "Freelance Consulting 2024"
option "operating_currency" "USD"
plugin "noduplicates"
plugin "leafonly"

2024-01-01 open Assets:Business:Checking    USD
2024-01-01 open Assets:Business:Savings     USD
2024-01-01 open Income:Consulting           USD
2024-01-01 open Income:Consulting:Acme      USD
2024-01-01 open Income:Consulting:TechCorp  USD
2024-01-01 open Expenses:Software           USD
2024-01-01 open Expenses:Equipment          USD
2024-01-01 open Expenses:Office             USD
2024-01-01 open Expenses:Taxes:Federal      USD
2024-01-01 open Expenses:Taxes:State        USD
2024-01-01 open Liabilities:Taxes:Federal   USD
2024-01-01 open Liabilities:Taxes:State     USD
2024-01-01 open Equity:Opening              USD

; Starting balance
2024-01-01 * "Opening balance"
    Assets:Business:Checking        5000.00 USD
    Equity:Opening

; January income
2024-01-15 * "Acme Corp" "January consulting"
    Assets:Business:Checking        8500.00 USD
    Income:Consulting:Acme

2024-01-30 * "TechCorp" "API integration project"
    Assets:Business:Checking        4200.00 USD
    Income:Consulting:TechCorp

; Business expenses
2024-01-05 * "GitHub" "Team subscription"
    Expenses:Software                 44.00 USD
    Assets:Business:Checking

2024-01-10 * "AWS" "Cloud hosting"
    Expenses:Software                156.00 USD
    Assets:Business:Checking

2024-01-20 * "Apple" "MacBook Pro"
    Expenses:Equipment             2499.00 USD
    Assets:Business:Checking

; Set aside for quarterly taxes (30%)
2024-01-31 * "Tax reserve Q1"
    Assets:Business:Savings         3810.00 USD
    Assets:Business:Checking

; Q1 estimated tax payment
2024-04-15 * "IRS" "Q1 estimated tax"
    Expenses:Taxes:Federal          2800.00 USD
    Assets:Business:Savings

2024-04-15 * "State FTB" "Q1 estimated tax"
    Expenses:Taxes:State             700.00 USD
    Assets:Business:Savings`,

    errors: `; === Example with Errors ===
; This file demonstrates error detection

option "title" "Error Examples"

2024-01-01 open Assets:Checking USD
2024-01-01 open Expenses:Food USD

; Error 1: Transaction doesn't balance
2024-01-15 * "Grocery Store"
    Expenses:Food        50.00 USD
    Assets:Checking     -45.00 USD

; Error 2: Account not opened
2024-01-20 * "Coffee Shop"
    Expenses:Coffee      5.00 USD
    Assets:Checking

; Error 3: Balance assertion fails
2024-01-31 balance Assets:Checking 1000.00 USD

; Error 4: Invalid date
2024-13-01 * "Invalid month"
    Expenses:Food       10.00 USD
    Assets:Checking`,

    beancount: `;;; -*- mode: beancount; coding: utf-8; -*-
;;; Official Beancount Example Ledger
;;; From: github.com/beancount/beancount/examples/simple/basic.beancount
;;;
;;; This is a comprehensive example demonstrating Beancount features
;;; including multiple accounts, stock trading, mortgages, and more.

* Options

option "title" "Beancount Example Ledger"
option "operating_currency" "USD"
option "operating_currency" "CAD"


* Account Declarations

1970-01-01 open Assets:UTrade:Account                     USD
1970-01-01 open Assets:UTrade:Account:AAPL                AAPL
1970-01-01 open Assets:UTrade:Account:EWJ                 EWJ
1970-01-01 open Assets:AccountsReceivable

1970-01-01 open Liabilities:BestBank:Mortgage:Loan        USD
1970-01-01 open Liabilities:Credit-Card:VISA              USD
1970-01-01 open Liabilities:Condo-Management              USD

1970-01-01 open Equity:Opening-Balances

1970-01-01 open Income:Interest:Checking
1970-01-01 open Income:Interest:Savings
1970-01-01 open Income:Dividends
1970-01-01 open Income:Capital-Gains
1970-01-01 open Income:Salary:AcmeCo

1970-01-01 open Expenses:Financial:Fees
1970-01-01 open Expenses:Financial:Commissions
1970-01-01 open Expenses:Insurance:Life
1970-01-01 open Expenses:Food:Restaurant
1970-01-01 open Expenses:Food:Grocery
1970-01-01 open Expenses:Food:Alcool
1970-01-01 open Expenses:Communications:Phone
1970-01-01 open Expenses:Communications:Mail
1970-01-01 open Expenses:Transportation:Taxi
1970-01-01 open Expenses:Taxes:US-Federal                 USD
1970-01-01 open Expenses:Govt-Services                    USD
1970-01-01 open Expenses:Clothes
1970-01-01 open Expenses:Car:Gas
1970-01-01 open Expenses:Sports
1970-01-01 open Expenses:Sports:Gear
1970-01-01 open Expenses:Fun:Movie
1970-01-01 open Expenses:Books
1970-01-01 open Expenses:Medical
1970-01-01 open Expenses:Charity
1970-01-01 open Expenses:Home:Monthly:Condo-Fees
1970-01-01 open Expenses:Home:Monthly:Loan-Interest


* Assets:BestBank:Checking

1970-01-01 open Assets:BestBank:Checking                  USD

;; Pad to opening balance (auto-inserts equity entry)
2007-12-31 pad Assets:BestBank:Checking   Equity:Opening-Balances
2008-01-01 balance Assets:BestBank:Checking  1412.24 USD


;; Government tax rebate deposit
2008-01-05 * "GST CANADA" "Deposit from govt for consumer tax rebate"
  Assets:BestBank:Checking       77.76 USD
  Expenses:Taxes:US-Federal

;; Salary deposits
2008-01-10 * "ACME" "Salary paid from employer"
  Assets:BestBank:Checking        2000.00 USD
  Income:Salary:AcmeCo           -2000.00 USD

2008-01-25 * "ACME" "Salary paid from employer"
  Assets:BestBank:Checking        2000.00 USD
  Income:Salary:AcmeCo

2008-02-10 * "ACME" "Salary paid from employer"
  Assets:BestBank:Checking        2000.00 USD
  Income:Salary:AcmeCo

2008-02-25 * "ACME" "Salary paid from employer"
  Assets:BestBank:Checking        2000.00 USD
  Income:Salary:AcmeCo

;; ATM withdrawals
2008-01-12 * "ATM withdrawal - 00044242"
  Assets:BestBank:Checking    -301.50 USD
  Expenses:Financial:Fees        1.50 USD
  Assets:Cash

2008-01-30 * "ATM withdrawal"
  Assets:BestBank:Checking    -800.00 USD
  Assets:Cash

;; Insurance payments
2008-01-02 * "LIFE INSURANCE -- LONDON LIFE"
  Assets:BestBank:Checking         -42.69 USD
  Expenses:Insurance:Life

2008-02-02 * "LIFE INSURANCE -- LONDON LIFE"
  Assets:BestBank:Checking         -42.69 USD
  Expenses:Insurance:Life

;; Debit card purchase
2008-01-17 * "Interac Purchase - 1341 - ACCES SPORTS S"
  Assets:BestBank:Checking      -89.00 USD
  Expenses:Sports:Gear

;; Monthly bank fee
2008-01-10 * "MONTHLY FEE"
  Assets:BestBank:Checking        -4.00 USD
  Expenses:Financial:Fees

;; Interest earned
2008-01-12 * "Deposit interest"
  Assets:BestBank:Checking         0.02 USD
  Income:Interest:Checking

;; Accounts receivable example
2008-03-26 * "Bought an iPhone for Gilbert (had to use ATM)"
  Assets:AccountsReceivable       431.92 USD
  Expenses:Financial:Fees           3.00 USD
  Assets:Cash                    -434.92 USD

2008-04-02 * "Gilbert paid back for iPhone"
  Assets:Cash                     431.92 USD
  Assets:AccountsReceivable      -431.92 USD

2008-02-01 balance Assets:BestBank:Checking   661.49 USD


* Assets:BestBank:Savings

1970-01-01 open Assets:BestBank:Savings                   USD
2007-12-31 pad  Assets:BestBank:Savings   Equity:Opening-Balances
2008-01-01 balance Assets:BestBank:Savings    12000 USD

;; Savings interest
2008-01-03 * "DEPOSIT INTEREST"
  Assets:BestBank:Savings         95.69 USD
  Income:Interest:Savings

;; Transfer between accounts
2008-01-29 * "Transfer from checking to savings account"
  Assets:BestBank:Savings       2000.00 USD
  Assets:BestBank:Checking

2008-02-03 * "DEPOSIT INTEREST"
  Assets:BestBank:Savings        102.34 USD
  Income:Interest:Savings

2008-02-03 * "Transferring money to brokerage account"
  Assets:BestBank:Savings     -10000.00 USD
  Assets:UTrade:Account

;; Mortgage payments (principal + interest split)
2008-01-12 * "MORTGAGE PAYMENT"
  Assets:BestBank:Savings                  -464.46 USD
  Liabilities:BestBank:Mortgage:Loan        171.01 USD
  Expenses:Home:Monthly:Loan-Interest

2008-01-27 * "MORTGAGE PAYMENT"
  Assets:BestBank:Savings                  -464.46 USD
  Liabilities:BestBank:Mortgage:Loan        171.01 USD
  Expenses:Home:Monthly:Loan-Interest

2008-02-12 * "MORTGAGE PAYMENT"
  Assets:BestBank:Savings                  -464.46 USD
  Liabilities:BestBank:Mortgage:Loan        171.01 USD
  Expenses:Home:Monthly:Loan-Interest

2008-03-01 balance Assets:BestBank:Savings    2340.19 USD


* Liabilities:Credit-Card:VISA

2007-12-31 pad Liabilities:Credit-Card:VISA  Equity:Opening-Balances
2008-01-01 balance Liabilities:Credit-Card:VISA  -791.34 USD

;; Credit card payment
2008-01-22 * "Online Banking payment - 5051 - VISA"
  Assets:BestBank:Checking     -791.34 USD
  Liabilities:Credit-Card:VISA

;; Restaurant expenses on credit card
2008-01-15 * "Cafe Imagination" ""
  Liabilities:Credit-Card:VISA
  Expenses:Food:Restaurant        47.00 USD

2008-01-19 * "Soupe Bol" ""
  Liabilities:Credit-Card:VISA   -21.00 USD
  Expenses:Food:Restaurant

2008-01-27 * "Scola Pasta" ""
  Liabilities:Credit-Card:VISA
  Expenses:Food:Restaurant        51.17 USD

;; Cell phone bill
2008-01-19 * "FIDO" ""
  Liabilities:Credit-Card:VISA
  Expenses:Communications:Phone  121.96 USD


* Assets:UTrade:Account (Stock Trading)

2007-12-31 pad Assets:UTrade:Account  Equity:Opening-Balances
2008-01-01 balance  Assets:UTrade:Account  31273.02 USD

;; Buy Apple stock (cost basis tracking)
2008-01-08 * "Buy some Apple Computer"
  Assets:UTrade:Account:AAPL          30 AAPL {185.40 USD}
  Assets:UTrade:Account
  Expenses:Financial:Commissions       9.95 USD

;; Dividend payment
2008-02-02 * "DIVIDEND from AAPL position"
  Assets:UTrade:Account    0.68 USD
  Income:Dividends

;; Sell Apple stock (capital gains)
2008-02-28 * "Sell off my Apple"
  Assets:UTrade:Account:AAPL   -30 AAPL {185.40 USD} @ 193.02 USD
  Assets:UTrade:Account       5780.65 USD
  Expenses:Financial:Commissions      9.95 USD
  Income:Capital-Gains

;; Buy Japanese ETF
2008-02-10 * "Buy some japanese ETF from iShares"
  Assets:UTrade:Account:EWJ          100 EWJ {13.34 USD}
  Assets:UTrade:Account
  Expenses:Financial:Commissions      9.95 USD

;; Balance assertions
2008-03-01 balance  Assets:UTrade:Account       40138.45 USD
2008-03-01 balance  Assets:UTrade:Account:AAPL  0 AAPL
2008-03-01 balance  Assets:UTrade:Account:EWJ   100 EWJ


* Condo Fees

2007-12-31 pad Liabilities:Condo-Management  Equity:Opening-Balances
2008-01-01 balance Liabilities:Condo-Management  -41.11 USD

2008-01-01 * "Propri-Manage" ""
  Expenses:Home:Monthly:Condo-Fees   212.61 USD
  Liabilities:Condo-Management

2008-01-14 * "(998) Propri-Manage" "cheque sent by snail mail"
  Liabilities:Condo-Management       800.00 USD
  Assets:BestBank:Checking

2008-02-01 * "Propri-Manage" ""
  Expenses:Home:Monthly:Condo-Fees   212.61 USD
  Liabilities:Condo-Management

2008-03-01 * "Propri-Manage" ""
  Expenses:Home:Monthly:Condo-Fees   212.61 USD
  Liabilities:Condo-Management


* Assets:Cash & Expenses

1970-01-01 open Assets:Cash
2007-12-30 pad  Assets:Cash  Equity:Opening-Balances

2007-12-31 balance  Assets:Cash   200 CAD
2007-12-31 balance  Assets:Cash   300 USD

;; Cash expense distribution
2008-01-02 * "Distribution of cash expenses"
  Expenses:Food:Restaurant   300.00 USD
  Expenses:Food:Alcool       100.00 USD
  Assets:Cash

2008-02-02 * "Distribution of cash expenses"
  Expenses:Food:Restaurant   300.00 USD
  Expenses:Food:Alcool       100.00 USD
  Assets:Cash

;; Various cash expenses
2008-02-18 * "DMV" "Renewal of driver's license."
  Expenses:Govt-Services     110.00 USD
  Assets:Cash

2008-01-21 * "WHOLE FOODS" ""
  Expenses:Food:Grocery       54.03 USD
  Assets:Cash

2008-01-21 * "USPS" "sent package to mom"
  Expenses:Communications:Mail  4.43 USD
  Assets:Cash

2008-02-04 * "taxi home from meeting"
  Expenses:Transportation:Taxi  12.00 USD
  Assets:Cash


* Ski Trip (Tagged Transactions)

pushtag #ski-trip

2008-01-27 * "SUNONO" "fill'er up"
  Expenses:Car:Gas            40 USD
  Assets:Cash

2008-01-27 * "SKII" "Lift tickets"
  Expenses:Sports            120 USD
  Assets:Cash

2008-01-27 * "Dinner at chalet"
  Expenses:Food:Restaurant    35.33 USD
  Assets:Cash

2008-01-28 * "breakfast"
  Expenses:Food:Restaurant    17.23 USD
  Assets:Cash

2008-01-28 * "a new hat, it was cold"
  Expenses:Clothes            40.02 USD
  Assets:Cash

poptag #ski-trip


* Other Expenses

2008-03-03 * "ALDO" "new shoes"
  Expenses:Clothes           121.20 USD
  Assets:Cash

2008-02-24 * "AMC" "movies with girlfriend"
  Expenses:Fun:Movie          24 USD
  Assets:Cash

2008-03-06 * "Barnes & Noble" "books on accounting"
  Expenses:Books              74.43 USD
  Assets:Cash

2008-02-03 * "ITHURTS MEDICAL CENT" "x-ray for broken bones"
  Expenses:Medical           312.00 USD
  Assets:Cash

2008-03-02 * "ZEN CENTER" "Donation to Zen center"
  Expenses:Charity            50 USD
  Assets:Cash


* Final Balances & Prices

2008-03-01 balance  Assets:Cash   200.00 CAD
2008-03-01 balance  Assets:Cash    30.96 USD

2008-03-15 price USD  1.0934 CAD

2013-07-03 event "location" "New York City"`,
};

/** @type {ExampleName[]} */
export const exampleNames = [
    'simple',
    'stocks',
    'crypto',
    'travel',
    'business',
    'errors',
    'beancount',
];
