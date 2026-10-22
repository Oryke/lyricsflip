import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}





/**
 * Ported from `onchain/src/utils/types.cairo`. `felt252`/`ByteArray` fields
 * become `String`; Starknet's `u8` fields become `u32` since Soroban has no
 * native u8 contract type.
 */
export interface Card {
  artist: string;
  card_id: u64;
  genre: Genre;
  lyrics: string;
  title: string;
  year: u64;
}

/**
 * Mirrors Cairo's single `ADMIN_ROLE` selector. Kept as an enum (instead of
 * dropping the parameter entirely) so `set_role`/`is_admin` keep the same
 * call shape as the original `ILyricsFlip` interface.
 */
export enum Role {
  Admin = 0,
}

/**
 * Explicit discriminants make this a "simple" contracttype enum, which
 * soroban-sdk encodes as a plain `u32` (and the JS SDK decodes to a plain
 * `number`) rather than the `{tag, values}` shape used for enums with
 * associated data (see `Answer` below). Keep `frontend/src/lib/stellar/types.ts`'s
 * `GENRE_VALUES` ordering in sync with these values.
 */
export enum Genre {
  HipHop = 0,
  Pop = 1,
  Rock = 2,
  RnB = 3,
  Electronic = 4,
  Classical = 5,
  Jazz = 6,
  Country = 7,
  Blues = 8,
  Reggae = 9,
  Afrobeat = 10,
  Gospel = 11,
  Folk = 12,
}


export interface Round {
  admin: string;
  end_time: u64;
  genre: Genre;
  is_cancelled: boolean;
  is_completed: boolean;
  is_started: boolean;
  next_card_index: u32;
  round_id: u64;
  start_time: u64;
  wager_amount: i128;
}

export type Answer = {tag: "Artist", values: readonly [string]} | {tag: "Year", values: readonly [u64]} | {tag: "Title", values: readonly [string]};


/**
 * Position of a card in the global, genre, artist and year indexes.
 */
export interface CardPos {
  all: u32;
  artist: u32;
  genre: u32;
  year: u32;
}

export type DataKey = {tag: "Owner", values: void} | {tag: "PendingOwner", values: void} | {tag: "Admin", values: readonly [string]} | {tag: "RoundCount", values: void} | {tag: "CardsCount", values: void} | {tag: "CardsPerRound", values: void} | {tag: "Card", values: readonly [u64]} | {tag: "LastCardId", values: void} | {tag: "CardKey", values: readonly [Buffer]} | {tag: "CardPos", values: readonly [u64]} | {tag: "CardAt", values: readonly [u32]} | {tag: "GenreCardCount", values: readonly [Genre]} | {tag: "GenreCardAt", values: readonly [readonly [Genre, u32]]} | {tag: "ArtistCardCount", values: readonly [string]} | {tag: "ArtistCardAt", values: readonly [readonly [string, u32]]} | {tag: "YearCardCount", values: readonly [u64]} | {tag: "YearCardAt", values: readonly [readonly [u64, u32]]} | {tag: "Round", values: readonly [u64]} | {tag: "RoundPlayers", values: readonly [u64]} | {tag: "RoundCards", values: readonly [u64]} | {tag: "RoundScores", values: readonly [u64]} | {tag: "RoundAnswerTimes", values: readonly [u64]} | {tag: "RoundCardStartedAt", values: readonly [readonly [u64, u64]]} | {tag: "RoundPlayerAnswered", values: readonly [readonly [u64, string, u64]]} | {tag: "RoundFinalized", values: readonly [u64]} | {tag: "PlayerStats", values: readonly [string]} | {tag: "RoundReady", values: readonly [readonly [u64, string]]} | {tag: "RoundReadyCount", values: readonly [u64]} | {tag: "OpenRounds", values: void} | {tag: "MaxPlayers", values: void} | {tag: "RoundCreatedAt", values: readonly [u64]} | {tag: "NftContract", values: void} | {tag: "MilestoneClaimed", values: readonly [readonly [string, Milestone]]};

/**
 * NFT reward milestones a player can claim once each via `claim_reward`.
 */
export enum Milestone {
  FirstWin = 0,
  Streak5 = 1,
  TenWins = 2,
}


export interface PlayerStats {
  current_streak: u64;
  max_streak: u64;
  rounds_won: u64;
  total_rounds: u64;
}


export interface QuestionCard {
  /**
 * Which attribute the options represent (Title / Artist / Year).
 */
kind: QuestionKind;
  lyric: string;
  option_four: string;
  option_one: string;
  option_three: string;
  option_two: string;
  timestamp: u64;
}

/**
 * Specifies what the player is asked to identify in a `QuestionCard`.
 * Using explicit discriminants keeps the on-chain ABI stable and makes the
 * JS SDK decode to a plain `number` (same encoding rule as `Genre`/`Role`).
 * Keep `frontend/src/lib/stellar/types.ts`'s `QUESTION_KIND_VALUES` in sync.
 */
export enum QuestionKind {
  Title = 0,
  Artist = 1,
  Year = 2,
}

/**
 * Contract error codes. Clients (see `frontend/src/lib/stellar/errors.ts`)
 * map on the numeric values, so they are part of the public ABI: never
 * renumber or reuse a code. New variants take the next free number, and the
 * table in `onchain/README.md` plus `test::error_codes_are_stable` must be
 * updated alongside.
 */
export const Errors = {
  /**
   * Defensive only: `__constructor` runs exactly once per deployment, so
   * this is unreachable in practice.
   */
  1: {message:"AlreadyInitialized"},
  2: {message:"NonExistingRound"},
  3: {message:"RoundAlreadyStarted"},
  4: {message:"NonExistingGenre"},
  5: {message:"RoundAlreadyJoined"},
  6: {message:"InvalidCardsPerRound"},
  7: {message:"ArtistCardsIsZero"},
  8: {message:"EmptyYearCards"},
  9: {message:"EmptyGenreCards"},
  10: {message:"RoundNotStarted"},
  11: {message:"RoundCompleted"},
  12: {message:"NotAParticipant"},
  13: {message:"AlreadyReady"},
  14: {message:"NotAuthorized"},
  15: {message:"AmountExceedsLimit"},
  16: {message:"LimitMustBeGreaterThanZero"},
  18: {message:"RoundNotReady"},
  19: {message:"RoundAlreadyFinalized"},
  17: {message:"NonExistingCard"},
  21: {message:"RoundFull"},
  26: {message:"InvalidCardTitle"},
  27: {message:"InvalidCardArtist"},
  28: {message:"InvalidCardLyrics"},
  29: {message:"InvalidCardYear"},
  30: {message:"LyricsTooLong"},
  31: {message:"DuplicateCard"},
  32: {message:"BatchTooLarge"},
  20: {message:"RoundCancelled"},
  22: {message:"InvalidMaxPlayers"},
  23: {message:"NftContractNotSet"},
  24: {message:"MilestoneNotReached"},
  25: {message:"MilestoneAlreadyClaimed"},
  33: {message:"NotPendingOwner"},
  /**
   * `set_max_players` got a value above `MAX_ROUND_PLAYERS`.
   */
  45: {message:"MaxPlayersTooHigh"}
}


















export interface Client {
  /**
   * Construct and simulate a owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  owner: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Owner-only. Replaces this contract's code in place, keeping all
   * storage.
   */
  upgrade: ({caller, new_wasm_hash}: {caller: string, new_wasm_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a version transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  version: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a add_card transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Adds a card and returns its id. The `card_id` field of `card` is
   * ignored; the stored card carries the assigned id.
   */
  add_card: ({caller, card}: {caller: string, card: Card}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_card transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_card: ({card_id}: {card_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Card>>

  /**
   * Construct and simulate a is_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_admin: ({role, address}: {role: Role, address: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a set_role transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Owner-only. The owner may manage roles even after revoking their own
   * admin flag, so they can never lock themselves out.
   */
  set_role: ({caller, recipient, role, is_enable}: {caller: string, recipient: string, role: Role, is_enable: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a add_cards transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Adds up to `MAX_CARDS_PER_BATCH` cards in one call and returns their
   * ids in order. The whole batch fails if any card is invalid.
   */
  add_cards: ({caller, cards}: {caller: string, cards: Array<Card>}, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a get_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_round: ({round_id}: {round_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Round>>

  /**
   * Construct and simulate a next_card transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  next_card: ({round_id}: {round_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Card>>

  /**
   * Construct and simulate a get_rounds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns up to `limit` rounds (clamped to `MAX_PAGE_LIMIT`) starting at
   * round id `start`, in ascending id order. Round ids begin at 1, so a
   * `start` of 0 is treated as 1. Returns an empty list past the end.
   */
  get_rounds: ({start, limit}: {start: u64, limit: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Round>>>

  /**
   * Construct and simulate a join_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  join_round: ({caller, round_id}: {caller: string, round_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a leave_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Leaves a round that hasn't started yet and refunds the caller's wager.
   * The round admin can't leave; they cancel the round instead.
   */
  leave_round: ({caller, round_id}: {caller: string, round_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a remove_card transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Removes a card from storage and every index. Its id is not reused.
   */
  remove_card: ({caller, card_id}: {caller: string, card_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a start_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  start_round: ({caller, round_id}: {caller: string, round_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a update_card transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Replaces the contents of `card_id`, moving it between the genre,
   * artist and year indexes as needed.
   */
  update_card: ({caller, card_id, card}: {caller: string, card_id: u64, card: Card}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a cancel_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancels a round that hasn't started and refunds every player. Callable
   * by the round admin at any time before start, or by anyone once the
   * lobby has been open for `LOBBY_TIMEOUT_SECONDS`.
   */
  cancel_round: ({caller, round_id}: {caller: string, round_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a claim_reward transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Mints the NFT for `milestone` to `caller` through a cross-contract
   * call. This contract must be the NFT contract's minter. Each milestone
   * can be claimed once per player.
   */
  claim_reward: ({caller, milestone}: {caller: string, milestone: Milestone}, options?: MethodOptions) => Promise<AssembledTransaction<u128>>

  /**
   * Construct and simulate a create_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_round: ({caller, genre, seed}: {caller: string, genre: Option<Genre>, seed: u64}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a pending_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  pending_owner: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a submit_answer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  submit_answer: ({caller, round_id, answer}: {caller: string, round_id: u64, answer: Answer}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a finalize_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  finalize_round: ({caller, round_id}: {caller: string, round_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_cards_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Number of live (added and not removed) cards.
   */
  get_cards_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_max_players transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_max_players: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_open_rounds transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Ids of rounds that are created but not yet started (i.e. joinable),
   * oldest first. `start` is an offset into that list and `limit` is
   * clamped to `MAX_PAGE_LIMIT`.
   */
  get_open_rounds: ({start, limit}: {start: u32, limit: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a get_player_stat transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_player_stat: ({player}: {player: string}, options?: MethodOptions) => Promise<AssembledTransaction<PlayerStats>>

  /**
   * Construct and simulate a get_round_cards transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_round_cards: ({round_id}: {round_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a get_round_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_round_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a set_max_players transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_max_players: ({caller, value}: {caller: string, value: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a accept_ownership transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Completes an ownership transfer and grants the new owner the admin
   * role. The previous owner keeps any admin role they had.
   */
  accept_ownership: ({caller}: {caller: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_nft_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_nft_contract: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a get_round_scores transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_round_scores: ({round_id}: {round_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Map<string, u64>>>

  /**
   * Construct and simulate a set_nft_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_nft_contract: ({caller, nft_contract}: {caller: string, nft_contract: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_round_players transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_round_players: ({round_id}: {round_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Array<string>>>

  /**
   * Construct and simulate a get_cards_of_genre transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_cards_of_genre: ({genre, seed}: {genre: Genre, seed: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Card>>>

  /**
   * Construct and simulate a transfer_ownership transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Step one of an ownership transfer; `new_owner` must then call
   * `accept_ownership`. Calling again replaces the pending owner.
   */
  transfer_ownership: ({caller, new_owner}: {caller: string, new_owner: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a build_question_card transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  build_question_card: ({card, seed, kind}: {card: Card, seed: u64, kind: QuestionKind}, options?: MethodOptions) => Promise<AssembledTransaction<QuestionCard>>

  /**
   * Construct and simulate a get_cards_of_a_year transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_cards_of_a_year: ({year, seed}: {year: u64, seed: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Card>>>

  /**
   * Construct and simulate a get_cards_of_artist transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_cards_of_artist: ({artist, seed}: {artist: string, seed: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Card>>>

  /**
   * Construct and simulate a get_cards_per_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_cards_per_round: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a set_cards_per_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_cards_per_round: ({caller, value}: {caller: string, value: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_genre_card_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_genre_card_count: ({genre}: {genre: Genre}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a is_milestone_claimed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_milestone_claimed: ({player, milestone}: {player: string, milestone: Milestone}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_players_round_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_players_round_count: ({round_id}: {round_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<u32>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {owner}: {owner: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({owner}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAAAAAAAFb3duZXIAAAAAAAAAAAAAAQAAABM=",
        "AAAAAAAAAEhPd25lci1vbmx5LiBSZXBsYWNlcyB0aGlzIGNvbnRyYWN0J3MgY29kZSBpbiBwbGFjZSwga2VlcGluZyBhbGwKc3RvcmFnZS4AAAAHdXBncmFkZQAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAADW5ld193YXNtX2hhc2gAAAAAAAPuAAAAIAAAAAA=",
        "AAAAAAAAAAAAAAAHdmVyc2lvbgAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAHJBZGRzIGEgY2FyZCBhbmQgcmV0dXJucyBpdHMgaWQuIFRoZSBgY2FyZF9pZGAgZmllbGQgb2YgYGNhcmRgIGlzCmlnbm9yZWQ7IHRoZSBzdG9yZWQgY2FyZCBjYXJyaWVzIHRoZSBhc3NpZ25lZCBpZC4AAAAAAAhhZGRfY2FyZAAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAEY2FyZAAAB9AAAAAEQ2FyZAAAAAEAAAAG",
        "AAAAAAAAAAAAAAAIZ2V0X2NhcmQAAAABAAAAAAAAAAdjYXJkX2lkAAAAAAYAAAABAAAH0AAAAARDYXJk",
        "AAAAAAAAAAAAAAAIaXNfYWRtaW4AAAACAAAAAAAAAARyb2xlAAAH0AAAAARSb2xlAAAAAAAAAAdhZGRyZXNzAAAAABMAAAABAAAAAQ==",
        "AAAAAAAAAHdPd25lci1vbmx5LiBUaGUgb3duZXIgbWF5IG1hbmFnZSByb2xlcyBldmVuIGFmdGVyIHJldm9raW5nIHRoZWlyIG93bgphZG1pbiBmbGFnLCBzbyB0aGV5IGNhbiBuZXZlciBsb2NrIHRoZW1zZWx2ZXMgb3V0LgAAAAAIc2V0X3JvbGUAAAAEAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACXJlY2lwaWVudAAAAAAAABMAAAAAAAAABHJvbGUAAAfQAAAABFJvbGUAAAAAAAAACWlzX2VuYWJsZQAAAAAAAAEAAAAA",
        "AAAAAAAAAIBBZGRzIHVwIHRvIGBNQVhfQ0FSRFNfUEVSX0JBVENIYCBjYXJkcyBpbiBvbmUgY2FsbCBhbmQgcmV0dXJucyB0aGVpcgppZHMgaW4gb3JkZXIuIFRoZSB3aG9sZSBiYXRjaCBmYWlscyBpZiBhbnkgY2FyZCBpcyBpbnZhbGlkLgAAAAlhZGRfY2FyZHMAAAAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAABWNhcmRzAAAAAAAD6gAAB9AAAAAEQ2FyZAAAAAEAAAPqAAAABg==",
        "AAAAAAAAAAAAAAAJZ2V0X3JvdW5kAAAAAAAAAQAAAAAAAAAIcm91bmRfaWQAAAAGAAAAAQAAB9AAAAAFUm91bmQAAAA=",
        "AAAAAAAAAAAAAAAJbmV4dF9jYXJkAAAAAAAAAQAAAAAAAAAIcm91bmRfaWQAAAAGAAAAAQAAB9AAAAAEQ2FyZA==",
        "AAAAAAAAAMxSZXR1cm5zIHVwIHRvIGBsaW1pdGAgcm91bmRzIChjbGFtcGVkIHRvIGBNQVhfUEFHRV9MSU1JVGApIHN0YXJ0aW5nIGF0CnJvdW5kIGlkIGBzdGFydGAsIGluIGFzY2VuZGluZyBpZCBvcmRlci4gUm91bmQgaWRzIGJlZ2luIGF0IDEsIHNvIGEKYHN0YXJ0YCBvZiAwIGlzIHRyZWF0ZWQgYXMgMS4gUmV0dXJucyBhbiBlbXB0eSBsaXN0IHBhc3QgdGhlIGVuZC4AAAAKZ2V0X3JvdW5kcwAAAAAAAgAAAAAAAAAFc3RhcnQAAAAAAAAGAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD6gAAB9AAAAAFUm91bmQAAAA=",
        "AAAAAAAAAAAAAAAKam9pbl9yb3VuZAAAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAhyb3VuZF9pZAAAAAYAAAAA",
        "AAAAAAAAAIJMZWF2ZXMgYSByb3VuZCB0aGF0IGhhc24ndCBzdGFydGVkIHlldCBhbmQgcmVmdW5kcyB0aGUgY2FsbGVyJ3Mgd2FnZXIuClRoZSByb3VuZCBhZG1pbiBjYW4ndCBsZWF2ZTsgdGhleSBjYW5jZWwgdGhlIHJvdW5kIGluc3RlYWQuAAAAAAALbGVhdmVfcm91bmQAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAhyb3VuZF9pZAAAAAYAAAAA",
        "AAAAAAAAAEJSZW1vdmVzIGEgY2FyZCBmcm9tIHN0b3JhZ2UgYW5kIGV2ZXJ5IGluZGV4LiBJdHMgaWQgaXMgbm90IHJldXNlZC4AAAAAAAtyZW1vdmVfY2FyZAAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAAB2NhcmRfaWQAAAAABgAAAAA=",
        "AAAAAAAAAAAAAAALc3RhcnRfcm91bmQAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAhyb3VuZF9pZAAAAAYAAAAA",
        "AAAAAAAAAGNSZXBsYWNlcyB0aGUgY29udGVudHMgb2YgYGNhcmRfaWRgLCBtb3ZpbmcgaXQgYmV0d2VlbiB0aGUgZ2VucmUsCmFydGlzdCBhbmQgeWVhciBpbmRleGVzIGFzIG5lZWRlZC4AAAAAC3VwZGF0ZV9jYXJkAAAAAAMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAHY2FyZF9pZAAAAAAGAAAAAAAAAARjYXJkAAAH0AAAAARDYXJkAAAAAA==",
        "AAAAAAAAALpDYW5jZWxzIGEgcm91bmQgdGhhdCBoYXNuJ3Qgc3RhcnRlZCBhbmQgcmVmdW5kcyBldmVyeSBwbGF5ZXIuIENhbGxhYmxlCmJ5IHRoZSByb3VuZCBhZG1pbiBhdCBhbnkgdGltZSBiZWZvcmUgc3RhcnQsIG9yIGJ5IGFueW9uZSBvbmNlIHRoZQpsb2JieSBoYXMgYmVlbiBvcGVuIGZvciBgTE9CQllfVElNRU9VVF9TRUNPTkRTYC4AAAAAAAxjYW5jZWxfcm91bmQAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACHJvdW5kX2lkAAAABgAAAAA=",
        "AAAAAAAAAKhNaW50cyB0aGUgTkZUIGZvciBgbWlsZXN0b25lYCB0byBgY2FsbGVyYCB0aHJvdWdoIGEgY3Jvc3MtY29udHJhY3QKY2FsbC4gVGhpcyBjb250cmFjdCBtdXN0IGJlIHRoZSBORlQgY29udHJhY3QncyBtaW50ZXIuIEVhY2ggbWlsZXN0b25lCmNhbiBiZSBjbGFpbWVkIG9uY2UgcGVyIHBsYXllci4AAAAMY2xhaW1fcmV3YXJkAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAltaWxlc3RvbmUAAAAAAAfQAAAACU1pbGVzdG9uZQAAAAAAAAEAAAAK",
        "AAAAAAAAAAAAAAAMY3JlYXRlX3JvdW5kAAAAAwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAVnZW5yZQAAAAAAA+gAAAfQAAAABUdlbnJlAAAAAAAAAAAAAARzZWVkAAAABgAAAAEAAAAG",
        "AAAAAAAAAF1Qb3J0ZWQgZnJvbSB0aGUgQ2Fpcm8gYCNbY29uc3RydWN0b3JdYDogc2V0cyB0aGUgb3duZXIgYW5kIGdyYW50cyB0aGVtCnRoZSAob25seSkgYWRtaW4gcm9sZS4AAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABW93bmVyAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAANcGVuZGluZ19vd25lcgAAAAAAAAAAAAABAAAD6AAAABM=",
        "AAAAAAAAAAAAAAANc3VibWl0X2Fuc3dlcgAAAAAAAAMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAIcm91bmRfaWQAAAAGAAAAAAAAAAZhbnN3ZXIAAAAAB9AAAAAGQW5zd2VyAAAAAAABAAAAAQ==",
        "AAAAAAAAAAAAAAAOZmluYWxpemVfcm91bmQAAAAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAIcm91bmRfaWQAAAAGAAAAAA==",
        "AAAAAAAAAC1OdW1iZXIgb2YgbGl2ZSAoYWRkZWQgYW5kIG5vdCByZW1vdmVkKSBjYXJkcy4AAAAAAAAPZ2V0X2NhcmRzX2NvdW50AAAAAAAAAAABAAAABg==",
        "AAAAAAAAAAAAAAAPZ2V0X21heF9wbGF5ZXJzAAAAAAAAAAABAAAABA==",
        "AAAAAAAAAKFJZHMgb2Ygcm91bmRzIHRoYXQgYXJlIGNyZWF0ZWQgYnV0IG5vdCB5ZXQgc3RhcnRlZCAoaS5lLiBqb2luYWJsZSksCm9sZGVzdCBmaXJzdC4gYHN0YXJ0YCBpcyBhbiBvZmZzZXQgaW50byB0aGF0IGxpc3QgYW5kIGBsaW1pdGAgaXMKY2xhbXBlZCB0byBgTUFYX1BBR0VfTElNSVRgLgAAAAAAAA9nZXRfb3Blbl9yb3VuZHMAAAAAAgAAAAAAAAAFc3RhcnQAAAAAAAAEAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD6gAAAAY=",
        "AAAAAAAAAAAAAAAPZ2V0X3BsYXllcl9zdGF0AAAAAAEAAAAAAAAABnBsYXllcgAAAAAAEwAAAAEAAAfQAAAAC1BsYXllclN0YXRzAA==",
        "AAAAAAAAAAAAAAAPZ2V0X3JvdW5kX2NhcmRzAAAAAAEAAAAAAAAACHJvdW5kX2lkAAAABgAAAAEAAAPqAAAABg==",
        "AAAAAAAAAAAAAAAPZ2V0X3JvdW5kX2NvdW50AAAAAAAAAAABAAAABg==",
        "AAAAAAAAAAAAAAAPc2V0X21heF9wbGF5ZXJzAAAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAFdmFsdWUAAAAAAAAEAAAAAA==",
        "AAAAAAAAAHpDb21wbGV0ZXMgYW4gb3duZXJzaGlwIHRyYW5zZmVyIGFuZCBncmFudHMgdGhlIG5ldyBvd25lciB0aGUgYWRtaW4Kcm9sZS4gVGhlIHByZXZpb3VzIG93bmVyIGtlZXBzIGFueSBhZG1pbiByb2xlIHRoZXkgaGFkLgAAAAAAEGFjY2VwdF9vd25lcnNoaXAAAAABAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAAQZ2V0X25mdF9jb250cmFjdAAAAAAAAAABAAAD6AAAABM=",
        "AAAAAAAAAAAAAAAQZ2V0X3JvdW5kX3Njb3JlcwAAAAEAAAAAAAAACHJvdW5kX2lkAAAABgAAAAEAAAPsAAAAEwAAAAY=",
        "AAAAAAAAAAAAAAAQc2V0X25mdF9jb250cmFjdAAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAMbmZ0X2NvbnRyYWN0AAAAEwAAAAA=",
        "AAAAAAAAAAAAAAARZ2V0X3JvdW5kX3BsYXllcnMAAAAAAAABAAAAAAAAAAhyb3VuZF9pZAAAAAYAAAABAAAD6gAAABM=",
        "AAAAAAAAAAAAAAASZ2V0X2NhcmRzX29mX2dlbnJlAAAAAAACAAAAAAAAAAVnZW5yZQAAAAAAB9AAAAAFR2VucmUAAAAAAAAAAAAABHNlZWQAAAAGAAAAAQAAA+oAAAfQAAAABENhcmQ=",
        "AAAAAAAAAHtTdGVwIG9uZSBvZiBhbiBvd25lcnNoaXAgdHJhbnNmZXI7IGBuZXdfb3duZXJgIG11c3QgdGhlbiBjYWxsCmBhY2NlcHRfb3duZXJzaGlwYC4gQ2FsbGluZyBhZ2FpbiByZXBsYWNlcyB0aGUgcGVuZGluZyBvd25lci4AAAAAEnRyYW5zZmVyX293bmVyc2hpcAAAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAluZXdfb3duZXIAAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAATYnVpbGRfcXVlc3Rpb25fY2FyZAAAAAADAAAAAAAAAARjYXJkAAAH0AAAAARDYXJkAAAAAAAAAARzZWVkAAAABgAAAAAAAAAEa2luZAAAB9AAAAAMUXVlc3Rpb25LaW5kAAAAAQAAB9AAAAAMUXVlc3Rpb25DYXJk",
        "AAAAAAAAAAAAAAATZ2V0X2NhcmRzX29mX2FfeWVhcgAAAAACAAAAAAAAAAR5ZWFyAAAABgAAAAAAAAAEc2VlZAAAAAYAAAABAAAD6gAAB9AAAAAEQ2FyZA==",
        "AAAAAAAAAAAAAAATZ2V0X2NhcmRzX29mX2FydGlzdAAAAAACAAAAAAAAAAZhcnRpc3QAAAAAABAAAAAAAAAABHNlZWQAAAAGAAAAAQAAA+oAAAfQAAAABENhcmQ=",
        "AAAAAAAAAAAAAAATZ2V0X2NhcmRzX3Blcl9yb3VuZAAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAATc2V0X2NhcmRzX3Blcl9yb3VuZAAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAABXZhbHVlAAAAAAAABAAAAAA=",
        "AAAAAAAAAAAAAAAUZ2V0X2dlbnJlX2NhcmRfY291bnQAAAABAAAAAAAAAAVnZW5yZQAAAAAAB9AAAAAFR2VucmUAAAAAAAABAAAABA==",
        "AAAAAAAAAAAAAAAUaXNfbWlsZXN0b25lX2NsYWltZWQAAAACAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAAAAAAACW1pbGVzdG9uZQAAAAAAB9AAAAAJTWlsZXN0b25lAAAAAAAAAQAAAAE=",
        "AAAAAAAAAAAAAAAXZ2V0X3BsYXllcnNfcm91bmRfY291bnQAAAAAAQAAAAAAAAAIcm91bmRfaWQAAAAGAAAAAQAAAAQ=",
        "AAAAAQAAAKxQb3J0ZWQgZnJvbSBgb25jaGFpbi9zcmMvdXRpbHMvdHlwZXMuY2Fpcm9gLiBgZmVsdDI1MmAvYEJ5dGVBcnJheWAgZmllbGRzCmJlY29tZSBgU3RyaW5nYDsgU3RhcmtuZXQncyBgdThgIGZpZWxkcyBiZWNvbWUgYHUzMmAgc2luY2UgU29yb2JhbiBoYXMgbm8KbmF0aXZlIHU4IGNvbnRyYWN0IHR5cGUuAAAAAAAAAARDYXJkAAAABgAAAAAAAAAGYXJ0aXN0AAAAAAAQAAAAAAAAAAdjYXJkX2lkAAAAAAYAAAAAAAAABWdlbnJlAAAAAAAH0AAAAAVHZW5yZQAAAAAAAAAAAAAGbHlyaWNzAAAAAAAQAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAABHllYXIAAAAG",
        "AAAAAwAAAMVNaXJyb3JzIENhaXJvJ3Mgc2luZ2xlIGBBRE1JTl9ST0xFYCBzZWxlY3Rvci4gS2VwdCBhcyBhbiBlbnVtIChpbnN0ZWFkIG9mCmRyb3BwaW5nIHRoZSBwYXJhbWV0ZXIgZW50aXJlbHkpIHNvIGBzZXRfcm9sZWAvYGlzX2FkbWluYCBrZWVwIHRoZSBzYW1lCmNhbGwgc2hhcGUgYXMgdGhlIG9yaWdpbmFsIGBJTHlyaWNzRmxpcGAgaW50ZXJmYWNlLgAAAAAAAAAAAAAEUm9sZQAAAAEAAAAAAAAABUFkbWluAAAAAAAAAA==",
        "AAAAAwAAAVRFeHBsaWNpdCBkaXNjcmltaW5hbnRzIG1ha2UgdGhpcyBhICJzaW1wbGUiIGNvbnRyYWN0dHlwZSBlbnVtLCB3aGljaApzb3JvYmFuLXNkayBlbmNvZGVzIGFzIGEgcGxhaW4gYHUzMmAgKGFuZCB0aGUgSlMgU0RLIGRlY29kZXMgdG8gYSBwbGFpbgpgbnVtYmVyYCkgcmF0aGVyIHRoYW4gdGhlIGB7dGFnLCB2YWx1ZXN9YCBzaGFwZSB1c2VkIGZvciBlbnVtcyB3aXRoCmFzc29jaWF0ZWQgZGF0YSAoc2VlIGBBbnN3ZXJgIGJlbG93KS4gS2VlcCBgZnJvbnRlbmQvc3JjL2xpYi9zdGVsbGFyL3R5cGVzLnRzYCdzCmBHRU5SRV9WQUxVRVNgIG9yZGVyaW5nIGluIHN5bmMgd2l0aCB0aGVzZSB2YWx1ZXMuAAAAAAAAAAVHZW5yZQAAAAAAAA0AAAAAAAAABkhpcEhvcAAAAAAAAAAAAAAAAAADUG9wAAAAAAEAAAAAAAAABFJvY2sAAAACAAAAAAAAAANSbkIAAAAAAwAAAAAAAAAKRWxlY3Ryb25pYwAAAAAABAAAAAAAAAAJQ2xhc3NpY2FsAAAAAAAABQAAAAAAAAAESmF6egAAAAYAAAAAAAAAB0NvdW50cnkAAAAABwAAAAAAAAAFQmx1ZXMAAAAAAAAIAAAAAAAAAAZSZWdnYWUAAAAAAAkAAAAAAAAACEFmcm9iZWF0AAAACgAAAAAAAAAGR29zcGVsAAAAAAALAAAAAAAAAARGb2xrAAAADA==",
        "AAAAAQAAAAAAAAAAAAAABVJvdW5kAAAAAAAACgAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAhlbmRfdGltZQAAAAYAAAAAAAAABWdlbnJlAAAAAAAH0AAAAAVHZW5yZQAAAAAAAAAAAAAMaXNfY2FuY2VsbGVkAAAAAQAAAAAAAAAMaXNfY29tcGxldGVkAAAAAQAAAAAAAAAKaXNfc3RhcnRlZAAAAAAAAQAAAAAAAAAPbmV4dF9jYXJkX2luZGV4AAAAAAQAAAAAAAAACHJvdW5kX2lkAAAABgAAAAAAAAAKc3RhcnRfdGltZQAAAAAABgAAAAAAAAAMd2FnZXJfYW1vdW50AAAACw==",
        "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AAAAPkFkZHJlc3Mgb2YgdGhlIGBseXJpY3NmbGlwLW5mdGAgY29udHJhY3QgdXNlZCB0byBtaW50IHJld2FyZHMuAAAAAAALTmZ0Q29udHJhY3QAAAAAAQAAADhXaGV0aGVyIGEgcGxheWVyIGhhcyBhbHJlYWR5IGNsYWltZWQgYSBtaWxlc3RvbmUgcmV3YXJkLgAAABBNaWxlc3RvbmVDbGFpbWVkAAAAAQAAA+0AAAACAAAAEwAAB9AAAAAJTWlsZXN0b25lAAAA",
        "AAAAAwAAAEZORlQgcmV3YXJkIG1pbGVzdG9uZXMgYSBwbGF5ZXIgY2FuIGNsYWltIG9uY2UgZWFjaCB2aWEgYGNsYWltX3Jld2FyZGAuAAAAAAAAAAAACU1pbGVzdG9uZQAAAAAAAAMAAAAXQXQgbGVhc3Qgb25lIHJvdW5kIHdvbi4AAAAACEZpcnN0V2luAAAAAAAAACdBIHN0cmVhayBvZiBhdCBsZWFzdCA1IGNvcnJlY3QgYW5zd2Vycy4AAAAAB1N0cmVhazUAAAAAAQAAABdBdCBsZWFzdCAxMCByb3VuZHMgd29uLgAAAAAHVGVuV2lucwAAAAAC",
        "AAAAAQAAAAAAAAAAAAAAC1BsYXllclN0YXRzAAAAAAQAAAAAAAAADmN1cnJlbnRfc3RyZWFrAAAAAAAGAAAAAAAAAAptYXhfc3RyZWFrAAAAAAAGAAAAAAAAAApyb3VuZHNfd29uAAAAAAAGAAAAAAAAAAx0b3RhbF9yb3VuZHMAAAAG",
        "AAAAAQAAAAAAAAAAAAAADFF1ZXN0aW9uQ2FyZAAAAAcAAAA+V2hpY2ggYXR0cmlidXRlIHRoZSBvcHRpb25zIHJlcHJlc2VudCAoVGl0bGUgLyBBcnRpc3QgLyBZZWFyKS4AAAAAAARraW5kAAAH0AAAAAxRdWVzdGlvbktpbmQAAAAAAAAABWx5cmljAAAAAAAAEAAAAAAAAAALb3B0aW9uX2ZvdXIAAAAAEAAAAAAAAAAKb3B0aW9uX29uZQAAAAAAEAAAAAAAAAAMb3B0aW9uX3RocmVlAAAAEAAAAAAAAAAKb3B0aW9uX3R3bwAAAAAAEAAAAAAAAAAJdGltZXN0YW1wAAAAAAAABg==",
        "AAAAAwAAASFTcGVjaWZpZXMgd2hhdCB0aGUgcGxheWVyIGlzIGFza2VkIHRvIGlkZW50aWZ5IGluIGEgYFF1ZXN0aW9uQ2FyZGAuClVzaW5nIGV4cGxpY2l0IGRpc2NyaW1pbmFudHMga2VlcHMgdGhlIG9uLWNoYWluIEFCSSBzdGFibGUgYW5kIG1ha2VzIHRoZQpKUyBTREsgZGVjb2RlIHRvIGEgcGxhaW4gYG51bWJlcmAgKHNhbWUgZW5jb2RpbmcgcnVsZSBhcyBgR2VucmVgL2BSb2xlYCkuCktlZXAgYGZyb250ZW5kL3NyYy9saWIvc3RlbGxhci90eXBlcy50c2AncyBgUVVFU1RJT05fS0lORF9WQUxVRVNgIGluIHN5bmMuAAAAAAAAAAAAAAxRdWVzdGlvbktpbmQAAAADAAAAAAAAAAVUaXRsZQAAAAAAAAAAAAAAAAAABkFydGlzdAAAAAAAAQAAAAAAAAAEWWVhcgAAAAI=",
        "AAAABAAAATNDb250cmFjdCBlcnJvciBjb2Rlcy4gQ2xpZW50cyAoc2VlIGBmcm9udGVuZC9zcmMvbGliL3N0ZWxsYXIvZXJyb3JzLnRzYCkKbWFwIG9uIHRoZSBudW1lcmljIHZhbHVlcywgc28gdGhleSBhcmUgcGFydCBvZiB0aGUgcHVibGljIEFCSTogbmV2ZXIKcmVudW1iZXIgb3IgcmV1c2UgYSBjb2RlLiBOZXcgdmFyaWFudHMgdGFrZSB0aGUgbmV4dCBmcmVlIG51bWJlciwgYW5kIHRoZQp0YWJsZSBpbiBgb25jaGFpbi9SRUFETUUubWRgIHBsdXMgYHRlc3Q6OmVycm9yX2NvZGVzX2FyZV9zdGFibGVgIG11c3QgYmUKdXBkYXRlZCBhbG9uZ3NpZGUuAAAAAAAAAAAFRXJyb3IAAAAAAAAiAAAAZURlZmVuc2l2ZSBvbmx5OiBgX19jb25zdHJ1Y3RvcmAgcnVucyBleGFjdGx5IG9uY2UgcGVyIGRlcGxveW1lbnQsIHNvCnRoaXMgaXMgdW5yZWFjaGFibGUgaW4gcHJhY3RpY2UuAAAAAAAAEkFscmVhZHlJbml0aWFsaXplZAAAAAAAAQAAAAAAAAAQTm9uRXhpc3RpbmdSb3VuZAAAAAIAAAAAAAAAE1JvdW5kQWxyZWFkeVN0YXJ0ZWQAAAAAAwAAAAAAAAAQTm9uRXhpc3RpbmdHZW5yZQAAAAQAAAAAAAAAElJvdW5kQWxyZWFkeUpvaW5lZAAAAAAABQAAAAAAAAAUSW52YWxpZENhcmRzUGVyUm91bmQAAAAGAAAAAAAAABFBcnRpc3RDYXJkc0lzWmVybwAAAAAAAAcAAAAAAAAADkVtcHR5WWVhckNhcmRzAAAAAAAIAAAAAAAAAA9FbXB0eUdlbnJlQ2FyZHMAAAAACQAAAAAAAAAPUm91bmROb3RTdGFydGVkAAAAAAoAAAAAAAAADlJvdW5kQ29tcGxldGVkAAAAAAALAAAAAAAAAA9Ob3RBUGFydGljaXBhbnQAAAAADAAAAAAAAAAMQWxyZWFkeVJlYWR5AAAADQAAAAAAAAANTm90QXV0aG9yaXplZAAAAAAAAA4AAAAAAAAAEkFtb3VudEV4Y2VlZHNMaW1pdAAAAAAADwAAAAAAAAAaTGltaXRNdXN0QmVHcmVhdGVyVGhhblplcm8AAAAAABAAAAAAAAAADVJvdW5kTm90UmVhZHkAAAAAAAASAAAAAAAAABVSb3VuZEFscmVhZHlGaW5hbGl6ZWQAAAAAAAATAAAAAAAAAA9Ob25FeGlzdGluZ0NhcmQAAAAAEQAAAAAAAAAJUm91bmRGdWxsAAAAAAAAFQAAAAAAAAAQSW52YWxpZENhcmRUaXRsZQAAABoAAAAAAAAAEUludmFsaWRDYXJkQXJ0aXN0AAAAAAAAGwAAAAAAAAARSW52YWxpZENhcmRMeXJpY3MAAAAAAAAcAAAAAAAAAA9JbnZhbGlkQ2FyZFllYXIAAAAAHQAAAAAAAAANTHlyaWNzVG9vTG9uZwAAAAAAAB4AAAAAAAAADUR1cGxpY2F0ZUNhcmQAAAAAAAAfAAAAAAAAAA1CYXRjaFRvb0xhcmdlAAAAAAAAIAAAAAAAAAAOUm91bmRDYW5jZWxsZWQAAAAAABQAAAAAAAAAEUludmFsaWRNYXhQbGF5ZXJzAAAAAAAAFgAAAAAAAAARTmZ0Q29udHJhY3ROb3RTZXQAAAAAAAAXAAAAAAAAABNNaWxlc3RvbmVOb3RSZWFjaGVkAAAAABgAAAAAAAAAF01pbGVzdG9uZUFscmVhZHlDbGFpbWVkAAAAABkAAAAAAAAAD05vdFBlbmRpbmdPd25lcgAAAAAhAAAAOGBzZXRfbWF4X3BsYXllcnNgIGdvdCBhIHZhbHVlIGFib3ZlIGBNQVhfUk9VTkRfUExBWUVSU2AuAAAAEU1heFBsYXllcnNUb29IaWdoAAAAAAAALQ==",
        "AAAABQAAAAAAAAAAAAAACUNhcmRBZGRlZAAAAAAAAAEAAAAKY2FyZF9hZGRlZAAAAAAAAgAAAAAAAAAHY2FyZF9pZAAAAAAGAAAAAQAAAAAAAAAFZ2VucmUAAAAAAAfQAAAABUdlbnJlAAAAAAAAAQAAAAI=",
        "AAAABQAAAAAAAAAAAAAACUNhcmREcmF3bgAAAAAAAAEAAAAKY2FyZF9kcmF3bgAAAAAAAwAAAAAAAAAIcm91bmRfaWQAAAAGAAAAAQAAAAAAAAAFaW5kZXgAAAAAAAAEAAAAAAAAAAAAAAAHY2FyZF9pZAAAAAAGAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAACVJvdW5kTGVmdAAAAAAAAAEAAAAKcm91bmRfbGVmdAAAAAAAAwAAAAAAAAAIcm91bmRfaWQAAAAGAAAAAQAAAAAAAAAGcGxheWVyAAAAAAATAAAAAQAAAAAAAAAIcmVmdW5kZWQAAAALAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAAC0NhcmRSZW1vdmVkAAAAAAEAAAAMY2FyZF9yZW1vdmVkAAAAAQAAAAAAAAAHY2FyZF9pZAAAAAAGAAAAAQAAAAI=",
        "AAAABQAAAAAAAAAAAAAAC0NhcmRVcGRhdGVkAAAAAAEAAAAMY2FyZF91cGRhdGVkAAAAAgAAAAAAAAAHY2FyZF9pZAAAAAAGAAAAAQAAAAAAAAAFZ2VucmUAAAAAAAfQAAAABUdlbnJlAAAAAAAAAQAAAAI=",
        "AAAABQAAAAAAAAAAAAAAC1BsYXllclJlYWR5AAAAAAEAAAAMcGxheWVyX3JlYWR5AAAAAwAAAAAAAAAIcm91bmRfaWQAAAAGAAAAAQAAAAAAAAAGcGxheWVyAAAAAAATAAAAAQAAAAAAAAAKcmVhZHlfdGltZQAAAAAABgAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAAC1JvbGVVcGRhdGVkAAAAAAEAAAAMcm9sZV91cGRhdGVkAAAAAwAAAAAAAAAHYWNjb3VudAAAAAATAAAAAQAAAAAAAAAEcm9sZQAAB9AAAAAEUm9sZQAAAAAAAAAAAAAAB2VuYWJsZWQAAAAAAQAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAAC1JvdW5kSm9pbmVkAAAAAAEAAAAMcm91bmRfam9pbmVkAAAAAwAAAAAAAAAIcm91bmRfaWQAAAAGAAAAAQAAAAAAAAAGcGxheWVyAAAAAAATAAAAAQAAAAAAAAALam9pbmVkX3RpbWUAAAAABgAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAADFJvdW5kQ3JlYXRlZAAAAAEAAAANcm91bmRfY3JlYXRlZAAAAAAAAAMAAAAAAAAACHJvdW5kX2lkAAAABgAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAEAAAAAAAAADGNyZWF0ZWRfdGltZQAAAAYAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAADFJvdW5kU3RhcnRlZAAAAAEAAAANcm91bmRfc3RhcnRlZAAAAAAAAAMAAAAAAAAACHJvdW5kX2lkAAAABgAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAEAAAAAAAAACnN0YXJ0X3RpbWUAAAAAAAYAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAADVJld2FyZENsYWltZWQAAAAAAAABAAAADnJld2FyZF9jbGFpbWVkAAAAAAADAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAABAAAAAAAAAAltaWxlc3RvbmUAAAAAAAfQAAAACU1pbGVzdG9uZQAAAAAAAAAAAAAAAAAACHRva2VuX2lkAAAACgAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAADlJvdW5kQ2FuY2VsbGVkAAAAAAABAAAAD3JvdW5kX2NhbmNlbGxlZAAAAAAEAAAAAAAAAAhyb3VuZF9pZAAAAAYAAAABAAAAAAAAAAxjYW5jZWxsZWRfYnkAAAATAAAAAQAAAD9QbGF5ZXJzIHdob3NlIHdhZ2VyIHdhcyByZWZ1bmRlZCAoZXZlcnlvbmUgc3RpbGwgaW4gdGhlIHJvdW5kKS4AAAAAEHJlZnVuZGVkX3BsYXllcnMAAAPqAAAAEwAAAAAAAAAAAAAAEXJlZnVuZF9wZXJfcGxheWVyAAAAAAAACwAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAADlJvdW5kQ29tcGxldGVkAAAAAAABAAAAD3JvdW5kX2NvbXBsZXRlZAAAAAADAAAAAAAAAAhyb3VuZF9pZAAAAAYAAAABAAAAAAAAAAd3aW5uZXJzAAAAA+oAAAATAAAAAAAAAAAAAAAGc2NvcmVzAAAAAAPsAAAAEwAAAAYAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAAD0Fuc3dlclN1Ym1pdHRlZAAAAAABAAAAEGFuc3dlcl9zdWJtaXR0ZWQAAAADAAAAAAAAAAhyb3VuZF9pZAAAAAYAAAABAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAABAAAAAAAAAAdjb3JyZWN0AAAAAAEAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAAFENhcmRzUGVyUm91bmRVcGRhdGVkAAAAAQAAABdjYXJkc19wZXJfcm91bmRfdXBkYXRlZAAAAAABAAAAAAAAAAV2YWx1ZQAAAAAAAAQAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAAFE93bmVyc2hpcFRyYW5zZmVycmVkAAAAAQAAABVvd25lcnNoaXBfdHJhbnNmZXJyZWQAAAAAAAACAAAAAAAAAAlvbGRfb3duZXIAAAAAAAATAAAAAQAAAAAAAAAJbmV3X293bmVyAAAAAAAAEwAAAAEAAAAC",
        "AAAABQAAAAAAAAAAAAAAGE93bmVyc2hpcFRyYW5zZmVyU3RhcnRlZAAAAAEAAAAab3duZXJzaGlwX3RyYW5zZmVyX3N0YXJ0ZWQAAAAAAAIAAAAAAAAABW93bmVyAAAAAAAAEwAAAAEAAAAAAAAADXBlbmRpbmdfb3duZXIAAAAAAAATAAAAAQAAAAI=" ]),
      options
    )
  }
  public readonly fromJSON = {
    owner: this.txFromJSON<string>,
        upgrade: this.txFromJSON<null>,
        version: this.txFromJSON<u32>,
        add_card: this.txFromJSON<u64>,
        get_card: this.txFromJSON<Card>,
        is_admin: this.txFromJSON<boolean>,
        set_role: this.txFromJSON<null>,
        add_cards: this.txFromJSON<Array<u64>>,
        get_round: this.txFromJSON<Round>,
        next_card: this.txFromJSON<Card>,
        get_rounds: this.txFromJSON<Array<Round>>,
        join_round: this.txFromJSON<null>,
        leave_round: this.txFromJSON<null>,
        remove_card: this.txFromJSON<null>,
        start_round: this.txFromJSON<null>,
        update_card: this.txFromJSON<null>,
        cancel_round: this.txFromJSON<null>,
        claim_reward: this.txFromJSON<u128>,
        create_round: this.txFromJSON<u64>,
        pending_owner: this.txFromJSON<Option<string>>,
        submit_answer: this.txFromJSON<boolean>,
        finalize_round: this.txFromJSON<null>,
        get_cards_count: this.txFromJSON<u64>,
        get_max_players: this.txFromJSON<u32>,
        get_open_rounds: this.txFromJSON<Array<u64>>,
        get_player_stat: this.txFromJSON<PlayerStats>,
        get_round_cards: this.txFromJSON<Array<u64>>,
        get_round_count: this.txFromJSON<u64>,
        set_max_players: this.txFromJSON<null>,
        accept_ownership: this.txFromJSON<null>,
        get_nft_contract: this.txFromJSON<Option<string>>,
        get_round_scores: this.txFromJSON<Map<string, u64>>,
        set_nft_contract: this.txFromJSON<null>,
        get_round_players: this.txFromJSON<Array<string>>,
        get_cards_of_genre: this.txFromJSON<Array<Card>>,
        transfer_ownership: this.txFromJSON<null>,
        build_question_card: this.txFromJSON<QuestionCard>,
        get_cards_of_a_year: this.txFromJSON<Array<Card>>,
        get_cards_of_artist: this.txFromJSON<Array<Card>>,
        get_cards_per_round: this.txFromJSON<u32>,
        set_cards_per_round: this.txFromJSON<null>,
        get_genre_card_count: this.txFromJSON<u32>,
        is_milestone_claimed: this.txFromJSON<boolean>,
        get_players_round_count: this.txFromJSON<u32>
  }
}