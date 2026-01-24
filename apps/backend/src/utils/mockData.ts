export const mockMarkets = [
    {
        id: "1",
        marketId: "market-1",
        question: "Will Bitcoin reach $100,000 by end of 2025?",
        description: "This market resolves to YES if Bitcoin price reaches or exceeds $100,000 USD on any major exchange before December 31, 2025.",
        category: "CRYPTO",
        createdAt: new Date(),
        endTimestamp: new Date("2025-12-31"),
        resolutionTimestamp: new Date("2026-01-01"),
        oracleSource: "CoinGecko",
        status: "ACTIVE",
        yesLiquidity: 50000,
        noLiquidity: 50000,
        totalVolume: 125000,
        yesPrice: 0.65,
        noPrice: 0.35,
        creator: { walletAddress: "7xKX...9Qwe" }
    },
    {
        id: "2",
        marketId: "market-2",
        question: "Will Ethereum ETF be approved in Q1 2026?",
        description: "This market resolves to YES if a spot Ethereum ETF is approved by the SEC in Q1 2026.",
        category: "CRYPTO",
        createdAt: new Date(),
        endTimestamp: new Date("2026-03-31"),
        resolutionTimestamp: new Date("2026-04-01"),
        oracleSource: "SEC Filings",
        status: "ACTIVE",
        yesLiquidity: 35000,
        noLiquidity: 45000,
        totalVolume: 89000,
        yesPrice: 0.44,
        noPrice: 0.56,
        creator: { walletAddress: "9mNv...2Hkl" }
    },
    {
        id: "3",
        marketId: "market-3",
        question: "Will AI pass the Turing Test by 2026?",
        description: "This market resolves to YES if any AI system officially passes the Turing Test as judged by an independent panel.",
        category: "TECHNOLOGY",
        createdAt: new Date(),
        endTimestamp: new Date("2026-12-31"),
        resolutionTimestamp: new Date("2027-01-01"),
        oracleSource: "AI Research Panel",
        status: "ACTIVE",
        yesLiquidity: 28000,
        noLiquidity: 32000,
        totalVolume: 67000,
        yesPrice: 0.47,
        noPrice: 0.53,
        creator: { walletAddress: "3pQr...8Tyu" }
    }
];

export const mockUsers: Record<string, any> = {};
