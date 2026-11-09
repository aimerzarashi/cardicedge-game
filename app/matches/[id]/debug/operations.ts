// デバッグの画面が読む query。操作の mutation は ../../operations.ts
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
        invadeChoices
        itemChoices
        relinquishChoices {
          x
          y
        }
        levelUpChoices {
          position {
            x
            y
          }
          level
          magic
        }
        exchangeChoices {
          position {
            x
            y
          }
          handIndex
          magic
        }
        invasion {
          position {
            x
            y
          }
          card {
            __typename
            id
            name
            cost
            rarity
            elements
            attack
            hitPoints
          }
          hitPoints
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
              attack
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
          maxHandCards
          startingHandCards
          tollPercentage
          relinquishPercentage
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
            ... on ItemCardInfo {
              category
              attackBonus
              hitPointsBonus
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
        awaitingParticipant
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
              ... on ItemCardInfo {
                category
                attackBonus
                hitPointsBonus
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
              ... on ItemCardInfo {
                category
                attackBonus
                hitPointsBonus
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
              ... on ItemCardInfo {
                category
                attackBonus
                hitPointsBonus
              }
            }
            creature
            position {
              x
              y
            }
            cost
          }
          ... on MatchTerritoryInvadedEvent {
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
              ... on ItemCardInfo {
                category
                attackBonus
                hitPointsBonus
              }
            }
            position {
              x
              y
            }
            cost
          }
          ... on MatchItemUsedEvent {
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
              ... on ItemCardInfo {
                category
                attackBonus
                hitPointsBonus
              }
            }
            cost
          }
          ... on MatchItemSkippedEvent {
            participant
          }
          ... on MatchBattleStartedEvent {
            attacker {
              attack
              hitPoints
            }
            defender {
              attack
              hitPoints
            }
          }
          ... on MatchBattleStatModifiedEvent {
            side
            attackDelta
            hitPointsDelta
            attack
            hitPoints
            source {
              __typename
              ... on MatchAdjacentTerritoriesSource {
                positions {
                  x
                  y
                }
              }
              ... on MatchTerrainSource {
                element
                level
              }
              ... on MatchItemSource {
                card {
                  id
                  name
                }
              }
            }
          }
          ... on MatchCreatureStruckEvent {
            striker
            damage
            remainingHitPoints
          }
          ... on MatchTerritoryConqueredEvent {
            participant
            position {
              x
              y
            }
            defeatedCreature
            creature
            territoryHitPoints
          }
          ... on MatchInvasionRepelledEvent {
            participant
            territoryHitPoints
            position {
              x
              y
            }
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
              ... on ItemCardInfo {
                category
                attackBonus
                hitPointsBonus
              }
            }
            returnedToHand
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
          ... on MatchTerritoryLeveledUpEvent {
            participant
            position {
              x
              y
            }
            level
            magic
          }
          ... on MatchCreatureExchangedEvent {
            participant
            position {
              x
              y
            }
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
              ... on ItemCardInfo {
                category
                attackBonus
                hitPointsBonus
              }
            }
            creature
            cost
            returnedCard {
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
              ... on ItemCardInfo {
                category
                attackBonus
                hitPointsBonus
              }
            }
          }
          ... on MatchTerritoryCommandSkippedEvent {
            participant
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
