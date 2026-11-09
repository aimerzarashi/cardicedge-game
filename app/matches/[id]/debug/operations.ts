// デバッグの画面だけが読む query。今の画面（../page.tsx・../../operations.ts）を変えないよう分ける
import { graphql } from "@/graphql";

export const matchDebugQuery = graphql(`
  query MatchDebug($id: UUID!) {
    match(id: $id) {
      __typename
      ... on Match {
        id
        roomId
        number
        revision
        round
        phase
        dice
        remainingSteps
        pathChoices {
          x
          y
        }
        deployChoices
        relinquishChoices {
          x
          y
        }
        territories {
          position {
            x
            y
          }
          owner
          level
          value
          toll
          relinquishMagic
          creature {
            id
            hitPoints
            card {
              id
              name
            }
          }
        }
        outcome {
          winners
          reason
          ranks
        }
        rewardPacks {
          key
          name
        }
        rules {
          targetMagic
          startingMagic
          lapBonus
          checkpointBonus
          roundLimit
          diceMin
          diceMax
          baseLandValue
        }
        board {
          width
          height
          tiles {
            __typename
            x
            y
            ... on LandTile {
              element
            }
          }
          pairs {
            a {
              x
              y
            }
            b {
              x
              y
            }
          }
        }
        participants {
          kind
          playerId
          avatar {
            name
          }
          position {
            x
            y
          }
          magic
          totalMagic
          hand {
            __typename
            id
            name
            cost
            rarity
            ... on CreatureCardInfo {
              elements
              attack
              hitPoints
            }
          }
          drawPileCount
          turnOrder
          passedCheckpoints {
            x
            y
          }
          rewardReceived
          rewardCards {
            name
          }
        }
        currentParticipant
      }
    }
  }
`);

export const matchDebugEventsQuery = graphql(`
  query MatchDebugEvents($id: UUID!, $after: Int!) {
    matchEvents(id: $id, after: $after) {
      __typename
      ... on MatchEventList {
        events {
          __typename
          revision
          changes {
            phase
            totalMagics {
              participant
              totalMagic
            }
            territoryValues {
              position {
                x
                y
              }
              value
              toll
            }
          }
          ... on MatchHandsDealtEvent {
            cards
          }
          ... on MatchTurnOrderDecidedEvent {
            order
          }
          ... on MatchCardDrawnEvent {
            participant
            card {
              __typename
              id
              name
              cost
              rarity
              ... on CreatureCardInfo {
                elements
                attack
                hitPoints
              }
            }
          }
          ... on MatchCardDiscardedEvent {
            participant
            handIndex
            card {
              __typename
              id
              name
              cost
              rarity
              ... on CreatureCardInfo {
                elements
                attack
                hitPoints
              }
            }
          }
          ... on MatchCreatureDeployedEvent {
            participant
            handIndex
            card {
              __typename
              id
              name
              cost
              rarity
              ... on CreatureCardInfo {
                elements
                attack
                hitPoints
              }
            }
            creature
            position {
              x
              y
            }
            cost
          }
          ... on MatchTollPaidEvent {
            participant
            owner
            position {
              x
              y
            }
            magic
          }
          ... on MatchTerritoryRelinquishedEvent {
            participant
            position {
              x
              y
            }
            creature
            magic
          }
          ... on MatchMagicDepletedEvent {
            participant
            magic
          }
          ... on MatchDiceRolledEvent {
            participant
            value
          }
          ... on MatchMovedEvent {
            participant
            to {
              x
              y
            }
          }
          ... on MatchCheckpointPassedEvent {
            participant
            checkpoint {
              x
              y
            }
            magic
          }
          ... on MatchLapCompletedEvent {
            participant
            magic
          }
          ... on MatchTurnEndedEvent {
            participant
          }
          ... on MatchEndedEvent {
            winners
            ranks
            reason
          }
          ... on MatchRewardDrawnEvent {
            participant
            pack
            rewardCards {
              name
            }
          }
        }
      }
    }
  }
`);
