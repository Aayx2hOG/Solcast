use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as TokenTransfer};

declare_id!("32RHEHXbReKvWE2bNxcH9486qLSNnH4nYMtWHe5axizE");

#[program]
pub mod kalshi {

    use super::*;

    pub fn initialize_protocol(ctx: Context<InitializeProtocol>, free_bps: u16) -> Result<()> {
        require!(free_bps <= 1000, ErrorCode::FeeTooHigh);

        let protocol_state = &mut ctx.accounts.protocol_state;
        protocol_state.authority = ctx.accounts.authority.key();
        protocol_state.treasury = ctx.accounts.treasury.key();
        protocol_state.free_bps = free_bps;
        protocol_state.total_markets = 0;
        protocol_state.total_volume = 0;
        protocol_state.treasury = ctx.accounts.treasury.key();
        protocol_state.bump = ctx.bumps.protocol_state;

        msg!("Protocol initialized with {}% fee", free_bps as f64 / 10.0);
        Ok(())
    }

    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_id: u64,
        question: String,
        description: String,
        category: MarketCategory,
        end_timestamp: i64,
        resolution_timestamp: i64,
        oracle_source: String,
        initial_liquidity: u64,
    ) -> Result<()> {
        require!(question.len() <= 200, ErrorCode::QuestionTooLong);
        require!(description.len() <= 1000, ErrorCode::DescriptionTooLong);
        require!(oracle_source.len() <= 100, ErrorCode::OracleSourceTooLong);
        require!(
            initial_liquidity >= 1_000_000,
            ErrorCode::InsufficientInitialLiquidity
        );

        let current_time = Clock::get()?.unix_timestamp;

        require!(end_timestamp > current_time, ErrorCode::InvalidEndTime);
        require!(
            resolution_timestamp > end_timestamp,
            ErrorCode::InvalidResolutionTime
        );
        require!(
            resolution_timestamp <= end_timestamp + 604800,
            ErrorCode::ResolutionTooLate
        );

        let market = &mut ctx.accounts.market;
        market.market_id = market_id;
        market.authority = ctx.accounts.creator.key();
        market.question = question;
        market.description = description;
        market.category = category;
        market.created_at = current_time;
        market.end_timestamp = end_timestamp;
        market.resolution_timestamp = resolution_timestamp;
        market.oracle_source = oracle_source;
        market.status = MarketStatus::Active;
        market.yes_liquidity = initial_liquidity / 2;
        market.no_liquidity = initial_liquidity / 2;
        market.total_yes_shares = initial_liquidity / 2;
        market.total_no_shares = initial_liquidity / 2;
        market.total_volume = 0;
        market.winning_outcome = None;
        market.bump = ctx.bumps.market;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TokenTransfer {
                    from: ctx.accounts.creator_token_account.to_account_info(),
                    to: ctx.accounts.market_vault.to_account_info(),
                    authority: ctx.accounts.creator.to_account_info(),
                },
            ),
            initial_liquidity,
        )?;

        let protocol_state = &mut ctx.accounts.protocol_state;
        protocol_state.total_markets += 1;

        msg!("Market {} created: {}", market_id, market.question);
        Ok(())
    }

    pub fn buy_shares(ctx: Context<BuyShares>, outcome: Outcome, max_cost: u64) -> Result<()> {
        let market = &ctx.accounts.market;
        require!(
            market.status == MarketStatus::Active,
            ErrorCode::MarketNotActive
        );
        let current_time = Clock::get()?.unix_timestamp;
        require!(current_time < market.end_timestamp, ErrorCode::MarketEnded);

        let (shares_out, actual_cost, fee) = calculate_buy_shares(
            if outcome == Outcome::Yes {
                market.yes_liquidity
            } else {
                market.no_liquidity
            },
            if outcome == Outcome::Yes {
                market.no_liquidity
            } else {
                market.yes_liquidity
            },
            max_cost,
            ctx.accounts.protocol_state.free_bps,
        )?;
        require!(actual_cost <= max_cost, ErrorCode::SlippageExceeded);
        require!(shares_out > 0, ErrorCode::InsufficientOutput);

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TokenTransfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.market_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            actual_cost - fee,
        )?;

        if fee > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    TokenTransfer {
                        from: ctx.accounts.user_token_account.to_account_info(),
                        to: ctx.accounts.protocol_treasury.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                fee,
            )?;
        }

        let market = &mut ctx.accounts.market;
        match outcome {
            Outcome::Yes => {
                market.yes_liquidity = market.yes_liquidity.checked_add(actual_cost - fee).unwrap();
                market.total_yes_shares = market.total_yes_shares.checked_add(shares_out).unwrap();
            }
            Outcome::No => {
                market.no_liquidity = market.no_liquidity.checked_add(actual_cost - fee).unwrap();
                market.total_no_shares = market.total_no_shares.checked_add(shares_out).unwrap();
            }
        }
        market.total_volume = market.total_volume.checked_add(actual_cost).unwrap();

        let position = &mut ctx.accounts.user_position;
        if !position.initialized {
            position.user = ctx.accounts.user.key();
            position.market = market.key();
            position.yes_shares = 0;
            position.no_shares = 0;
            position.total_invested = 0;
            position.initialized = true;
            position.bump = ctx.bumps.user_position;
        }
        match outcome {
            Outcome::Yes => {
                position.yes_shares = position.yes_shares.checked_add(shares_out).unwrap();
            }
            Outcome::No => {
                position.no_shares = position.no_shares.checked_add(shares_out).unwrap();
            }
        }
        position.total_invested = position.total_invested.checked_add(actual_cost).unwrap();
        ctx.accounts.protocol_state.total_volume = ctx
            .accounts
            .protocol_state
            .total_volume
            .checked_add(actual_cost)
            .unwrap();

        msg!(
            "Bought {} {:?} shares for {} USDC (fee: {})",
            shares_out,
            outcome,
            actual_cost,
            fee
        );
        Ok(())
    }

    pub fn sell_shares(
        ctx: Context<SellShares>,
        outcome: Outcome,
        shares_in: u64,
        min_payout: u64,
    ) -> Result<()> {
        let market = &ctx.accounts.market;
        require!(
            market.status == MarketStatus::Active,
            ErrorCode::MarketNotActive
        );
        let current_time = Clock::get()?.unix_timestamp;
        require!(current_time < market.end_timestamp, ErrorCode::MarketEnded);

        let position = &mut ctx.accounts.user_position;
        require!(position.initialized, ErrorCode::NoPosition);

        let user_shares = match outcome {
            Outcome::Yes => position.yes_shares,
            Outcome::No => position.no_shares,
        };
        require!(user_shares >= shares_in, ErrorCode::InsufficientShares);
        require!(shares_in > 0, ErrorCode::InvalidAmount);

        let (payout, fee) = calculate_sell_shares(
            if outcome == Outcome::Yes {
                market.yes_liquidity
            } else {
                market.no_liquidity
            },
            if outcome == Outcome::Yes {
                market.no_liquidity
            } else {
                market.yes_liquidity
            },
            shares_in,
            ctx.accounts.protocol_state.free_bps,
        )?;

        let payout_after_fee = payout.checked_sub(fee).unwrap();
        require!(payout_after_fee >= min_payout, ErrorCode::SlippageExceeded);

        let market_key = market.key();
        let seeds = &[b"market", market_key.as_ref(), &[market.bump]];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TokenTransfer {
                    from: ctx.accounts.market_vault.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.market.to_account_info(),
                },
                signer,
            ),
            payout_after_fee,
        )?;

        if fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    TokenTransfer {
                        from: ctx.accounts.market_vault.to_account_info(),
                        to: ctx.accounts.protocol_treasury.to_account_info(),
                        authority: ctx.accounts.market.to_account_info(),
                    },
                    signer,
                ),
                fee,
            )?;
        }

        let market = &mut ctx.accounts.market;
        match outcome {
            Outcome::Yes => {
                market.yes_liquidity = market.yes_liquidity.checked_sub(payout).unwrap();
                market.total_yes_shares = market.total_yes_shares.checked_sub(shares_in).unwrap();
            }
            Outcome::No => {
                market.no_liquidity = market.no_liquidity.checked_sub(payout).unwrap();
                market.total_no_shares = market.total_no_shares.checked_sub(shares_in).unwrap();
            }
        }
        market.total_volume = market.total_volume.checked_add(payout).unwrap();

        let position = &mut ctx.accounts.user_position;
        match outcome {
            Outcome::Yes => {
                position.yes_shares = position.yes_shares.checked_sub(shares_in).unwrap();
            }
            Outcome::No => {
                position.no_shares = position.no_shares.checked_sub(shares_in).unwrap();
            }
        }

        msg!(
            "Sold {} {:?} shares for {} (fee: {})",
            shares_in,
            outcome,
            payout,
            fee
        );

        Ok(())
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>, winning_outcome: Outcome) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(
            ctx.accounts.oracle.key() == market.authority
                || ctx.accounts.protocol_state.authority == ctx.accounts.oracle.key(),
            ErrorCode::UnauthorizedOracle
        );
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time >= market.end_timestamp,
            ErrorCode::MarketNotEnded
        );
        require!(
            current_time <= market.resolution_timestamp,
            ErrorCode::ResolutionDeadlinePassed
        );
        require!(
            market.status == MarketStatus::Active,
            ErrorCode::AlreadyResolved
        );

        market.status = MarketStatus::Resolved;
        market.winning_outcome = Some(winning_outcome);

        msg!(
            "Market {} resolved: {:?} wins",
            market.market_id,
            winning_outcome
        );
        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        require!(
            market.status == MarketStatus::Resolved,
            ErrorCode::MarketNotResolved
        );
        let winning_outcome = market.winning_outcome.unwrap();

        let position = &mut ctx.accounts.user_position;
        require!(position.initialized, ErrorCode::NoPosition);

        let winning_shares = match winning_outcome {
            Outcome::Yes => position.yes_shares,
            Outcome::No => position.no_shares,
        };
        require!(winning_shares > 0, ErrorCode::NoWinningShares);

        let payout = winning_shares;

        let market_key = market.key();
        let seeds = &[b"market", market_key.as_ref(), &[market.bump]];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TokenTransfer {
                    from: ctx.accounts.market_vault.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.market.to_account_info(),
                },
                signer,
            ),
            payout,
        )?;

        match winning_outcome {
            Outcome::Yes => {
                position.yes_shares = 0;
            }
            Outcome::No => {
                position.no_shares = 0;
            }
        }

        msg!(
            "Claimed {} winnings for {:?} shares",
            payout,
            winning_outcome
        );
        Ok(())
    }

    pub fn invalidate_market(ctx: Context<InvalidateMarket>) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(
            ctx.accounts.protocol_state.authority == ctx.accounts.authority.key(),
            ErrorCode::Unauthorized
        );
        require!(
            market.status == MarketStatus::Active,
            ErrorCode::InvalidMarketState
        );

        market.status = MarketStatus::Invalid;

        msg!("Market {} marked as invalid", market.market_id);
        Ok(())
    }

    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        let market = &ctx.accounts.market;
        require!(
            market.status == MarketStatus::Invalid,
            ErrorCode::MarketNotInvalid
        );

        let position = &mut ctx.accounts.user_position;
        require!(position.initialized, ErrorCode::NoPosition);

        let total_shares = position.yes_shares.checked_add(position.no_shares).unwrap();
        require!(total_shares > 0, ErrorCode::NoPosition);

        let refund_amount = total_shares;

        let market_key = market.key();
        let seeds = &[b"market", market_key.as_ref(), &[market.bump]];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TokenTransfer {
                    from: ctx.accounts.market_vault.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.market.to_account_info(),
                },
                signer,
            ),
            refund_amount,
        )?;

        position.yes_shares = 0;
        position.no_shares = 0;

        msg!("Claimed refund of {} for invalidated market", refund_amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProtocolState::INIT_SPACE,
        seeds = [b"protocol-state"],
        bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub treasury: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(market_id: u64)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Market::INIT_SPACE,
        seeds = [b"market", market_id.to_le_bytes().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = creator,
        token::mint = usdc_mint,
        token::authority = market,
        seeds = [b"market_vault", market.key().as_ref()],
        bump,
    )]
    pub market_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        constraint = creator_token_account.owner == creator.key(),
        constraint = creator_token_account.mint == usdc_mint.key(),
    )]
    pub creator_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BuyShares<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"market_vault", market.key().as_ref()],
        bump,
    )]
    pub market_vault: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserPosition::INIT_SPACE,
        seeds = [b"position",market.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut)]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(
        mut,
        constraint = protocol_treasury.key() == protocol_state.treasury,
    )]
    pub protocol_treasury: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == market_vault.mint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SellShares<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"market_vault", market.key().as_ref()],
        bump,
    )]
    pub market_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"position",market.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut)]
    pub protocol_state: Account<'info, ProtocolState>,

    #[account(
        mut,
        constraint = protocol_treasury.key() == protocol_state.treasury,
    )]
    pub protocol_treasury: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == market_vault.mint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,

    pub protocol_state: Account<'info, ProtocolState>,

    pub oracle: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    // Duplicate `market` field removed
    #[account(
        mut,
        seeds = [b"market_vault", market.key().as_ref()],
        bump,
    )]
    pub market_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"position",market.key().as_ref(), user.key().as_ref()],
        bump = user_position.bump,
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == market_vault.mint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct InvalidateMarket<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,

    #[account(
        constraint = protocol_state.authority == authority.key(),
    )]
    pub protocol_state: Account<'info, ProtocolState>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(
        mut,
        seeds = [b"market", market.market_id.to_le_bytes().as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"market_vault", market.key().as_ref()],
        bump,
    )]
    pub market_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"position",market.key().as_ref(), user.key().as_ref()],
        bump = user_position.bump,
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == market_vault.mint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct ProtocolState {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub free_bps: u16,
    pub total_markets: u64,
    pub total_volume: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Market {
    pub market_id: u64,
    pub authority: Pubkey,
    #[max_len(200)]
    pub question: String,
    #[max_len(1000)]
    pub description: String,
    pub category: MarketCategory,
    pub created_at: i64,
    pub end_timestamp: i64,
    pub resolution_timestamp: i64,
    #[max_len(100)]
    pub oracle_source: String,
    pub status: MarketStatus,
    pub yes_liquidity: u64,
    pub no_liquidity: u64,
    pub total_yes_shares: u64,
    pub total_no_shares: u64,
    pub total_volume: u64,
    pub winning_outcome: Option<Outcome>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserPosition {
    pub user: Pubkey,
    pub market: Pubkey,
    pub yes_shares: u64,
    pub no_shares: u64,
    pub total_invested: u64,
    pub initialized: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum Outcome {
    Yes,
    No,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum MarketStatus {
    Active,
    Resolved,
    Invalid,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub enum MarketCategory {
    Sports,
    Politics,
    Crypto,
    Economics,
    Entertainment,
    Science,
    Other,
}

// helper functions

fn calculate_buy_shares(
    outcome_liquidity: u64,
    opposite_liquidity: u64,
    max_payment: u64,
    free_bps: u16,
) -> Result<(u64, u64, u64)> {
    let fee: u64 = ((max_payment as u128)
        .checked_mul(free_bps as u128)
        .unwrap()
        .checked_div(10_000)
        .unwrap())
    .try_into()
    .unwrap();

    let payment_after_fee = max_payment.checked_sub(fee).unwrap();

    let k: u128 = (outcome_liquidity as u128)
        .checked_mul(opposite_liquidity as u128)
        .unwrap();

    let new_outcome_liquidity: u128 = (outcome_liquidity as u128)
        .checked_add(payment_after_fee as u128)
        .unwrap();

    let new_opposite_liquidity: u128 = k.checked_div(new_outcome_liquidity).unwrap();

    let shares_out_u128: u128 = (opposite_liquidity as u128)
        .checked_sub(new_opposite_liquidity)
        .unwrap();

    let shares_out: u64 = shares_out_u128.try_into().unwrap();

    Ok((shares_out, max_payment, fee))
}

fn calculate_sell_shares(
    outcome_liquidity: u64,
    opposite_liquidity: u64,
    shares_in: u64,
    free_bps: u16,
) -> Result<(u64, u64)> {
    let k: u128 = (outcome_liquidity as u128)
        .checked_mul(opposite_liquidity as u128)
        .unwrap();

    let new_opposite_liquidity: u128 = (opposite_liquidity as u128)
        .checked_add(shares_in as u128)
        .unwrap();

    let new_outcome_liquidity: u128 = k.checked_div(new_opposite_liquidity).unwrap();

    let payout_u128: u128 = (outcome_liquidity as u128)
        .checked_sub(new_outcome_liquidity)
        .unwrap();

    let payout: u64 = payout_u128.try_into().unwrap();

    let fee: u64 = ((payout as u128)
        .checked_mul(free_bps as u128)
        .unwrap()
        .checked_div(10_000)
        .unwrap())
    .try_into()
    .unwrap();

    Ok((payout, fee))
}

#[error_code]
pub enum ErrorCode {
    #[msg("Fee cannot exceed 10%")]
    FeeTooHigh,

    #[msg("Question is too long (max 200 characters)")]
    QuestionTooLong,

    #[msg("Description is too long (max 1000 characters)")]
    DescriptionTooLong,

    #[msg("Oracle source is too long (max 100 characters)")]
    OracleSourceTooLong,

    #[msg("Initial liquidity must be at least 1 USDC")]
    InsufficientInitialLiquidity,

    #[msg("End time must be in the future")]
    InvalidEndTime,

    #[msg("Resolution time must be after end time")]
    InvalidResolutionTime,

    #[msg("Resolution deadline too late (max 7 days after end)")]
    ResolutionTooLate,

    #[msg("Market is not active")]
    MarketNotActive,

    #[msg("Market has already ended")]
    MarketEnded,

    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,

    #[msg("Insufficient output amount")]
    InsufficientOutput,

    #[msg("User has no position in this market")]
    NoPosition,

    #[msg("Insufficient shares to sell")]
    InsufficientShares,

    #[msg("Invalid amount")]
    InvalidAmount,

    #[msg("Unauthorized oracle")]
    UnauthorizedOracle,

    #[msg("Market has not ended yet")]
    MarketNotEnded,

    #[msg("Resolution deadline has passed")]
    ResolutionDeadlinePassed,

    #[msg("Market already resolved")]
    AlreadyResolved,

    #[msg("Market not yet resolved")]
    MarketNotResolved,

    #[msg("No winning shares to claim")]
    NoWinningShares,

    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Invalid market state")]
    InvalidMarketState,

    #[msg("Market is not marked as invalid")]
    MarketNotInvalid,
}
