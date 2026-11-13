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
        spellChoices {
          handIndex
          targets
          targetPositions {
            x
            y
          }
        }
        placeChoices
        invadeChoices
        itemChoices
        relinquishChoices {
          x
          y
        }
        moveChoices {
          from {
            x
            y
          }
          to {
            x
            y
          }
        }
        landLevels {
          position {
            x
            y
          }
          level
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
        elementChangeChoices {
          position {
            x
            y
          }
          element
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
              itemRestrictions
              placementRestrictions
              abilities {
                kind
                ... on CreatureTollMultiplierAbility {
                  percent
                }
                ... on CreatureBattleModifierAbility {
                  attackModifier
                  hitPointsModifier
                }
                ... on CreatureBattleRandomStatsAbility {
                  minimum
                  maximum
                }
                ... on CreatureAttackImmunityAbility {
                  elements
                }
              }
            }
            ... on ItemCardInfo {
              category
              attackModifier
              hitPointsModifier
            }
            ... on SpellCardInfo {
              effect {
                __typename
                ... on DrawCardsSpellEffect {
                  count
                }
                ... on GainMagicSpellEffect {
                  perLap
                }
                ... on MultipleDiceSpellEffect {
                  count
                  turns
                }
                ... on FixedDiceSpellEffect {
                  value
                  turns
                }
                ... on DamageSpellEffect {
                  amount
                }
              }
            }
          }
          drawPileCount
          discardPile {
            id
            name
          }
          lastingSpellEffect {
            remainingTurns
            effect {
              __typename
              ... on MultipleDiceSpellEffect {
                count
                turns
              }
              ... on FixedDiceSpellEffect {
                value
                turns
              }
            }
          }
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
              level
              chainCount
              previousChainCount
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
                itemRestrictions
                placementRestrictions
                abilities {
                  kind
                  ... on CreatureTollMultiplierAbility {
                    percent
                  }
                  ... on CreatureBattleModifierAbility {
                    attackModifier
                    hitPointsModifier
                  }
                  ... on CreatureBattleRandomStatsAbility {
                    minimum
                    maximum
                  }
                  ... on CreatureAttackImmunityAbility {
                    elements
                  }
                }
              }
              ... on ItemCardInfo {
                category
                attackModifier
                hitPointsModifier
              }
              ... on SpellCardInfo {
                effect {
                  __typename
                  ... on DrawCardsSpellEffect {
                    count
                  }
                  ... on GainMagicSpellEffect {
                    perLap
                  }
                  ... on MultipleDiceSpellEffect {
                    count
                    turns
                  }
                  ... on FixedDiceSpellEffect {
                    value
                    turns
                  }
                  ... on DamageSpellEffect {
                    amount
                  }
                }
              }
            }
          }
          ... on MatchSpellUsedEvent {
            participant
            handIndex
            cost
            card {
              __typename
              id
              name
              cost
              rarity
            }
          }
          ... on MatchDiscardPileShuffledEvent {
            participant
            drawPileCount
          }
          ... on MatchHandLimitExceededEvent {
            participant
            handCount
            maxHandCards
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
                itemRestrictions
                placementRestrictions
                abilities {
                  kind
                  ... on CreatureTollMultiplierAbility {
                    percent
                  }
                  ... on CreatureBattleModifierAbility {
                    attackModifier
                    hitPointsModifier
                  }
                  ... on CreatureBattleRandomStatsAbility {
                    minimum
                    maximum
                  }
                  ... on CreatureAttackImmunityAbility {
                    elements
                  }
                }
              }
              ... on ItemCardInfo {
                category
                attackModifier
                hitPointsModifier
              }
              ... on SpellCardInfo {
                effect {
                  __typename
                  ... on DrawCardsSpellEffect {
                    count
                  }
                  ... on GainMagicSpellEffect {
                    perLap
                  }
                  ... on MultipleDiceSpellEffect {
                    count
                    turns
                  }
                  ... on FixedDiceSpellEffect {
                    value
                    turns
                  }
                  ... on DamageSpellEffect {
                    amount
                  }
                }
              }
            }
          }
          ... on MatchCreaturePlacedEvent {
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
                itemRestrictions
                placementRestrictions
                abilities {
                  kind
                  ... on CreatureTollMultiplierAbility {
                    percent
                  }
                  ... on CreatureBattleModifierAbility {
                    attackModifier
                    hitPointsModifier
                  }
                  ... on CreatureBattleRandomStatsAbility {
                    minimum
                    maximum
                  }
                  ... on CreatureAttackImmunityAbility {
                    elements
                  }
                }
              }
              ... on ItemCardInfo {
                category
                attackModifier
                hitPointsModifier
              }
              ... on SpellCardInfo {
                effect {
                  __typename
                  ... on DrawCardsSpellEffect {
                    count
                  }
                  ... on GainMagicSpellEffect {
                    perLap
                  }
                  ... on MultipleDiceSpellEffect {
                    count
                    turns
                  }
                  ... on FixedDiceSpellEffect {
                    value
                    turns
                  }
                  ... on DamageSpellEffect {
                    amount
                  }
                }
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
                itemRestrictions
                placementRestrictions
                abilities {
                  kind
                  ... on CreatureTollMultiplierAbility {
                    percent
                  }
                  ... on CreatureBattleModifierAbility {
                    attackModifier
                    hitPointsModifier
                  }
                  ... on CreatureBattleRandomStatsAbility {
                    minimum
                    maximum
                  }
                  ... on CreatureAttackImmunityAbility {
                    elements
                  }
                }
              }
              ... on ItemCardInfo {
                category
                attackModifier
                hitPointsModifier
              }
              ... on SpellCardInfo {
                effect {
                  __typename
                  ... on DrawCardsSpellEffect {
                    count
                  }
                  ... on GainMagicSpellEffect {
                    perLap
                  }
                  ... on MultipleDiceSpellEffect {
                    count
                    turns
                  }
                  ... on FixedDiceSpellEffect {
                    value
                    turns
                  }
                  ... on DamageSpellEffect {
                    amount
                  }
                }
              }
            }
            position {
              x
              y
            }
            cost
            defendingCreatureCard {
              name
            }
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
                itemRestrictions
                placementRestrictions
                abilities {
                  kind
                  ... on CreatureTollMultiplierAbility {
                    percent
                  }
                  ... on CreatureBattleModifierAbility {
                    attackModifier
                    hitPointsModifier
                  }
                  ... on CreatureBattleRandomStatsAbility {
                    minimum
                    maximum
                  }
                  ... on CreatureAttackImmunityAbility {
                    elements
                  }
                }
              }
              ... on ItemCardInfo {
                category
                attackModifier
                hitPointsModifier
              }
              ... on SpellCardInfo {
                effect {
                  __typename
                  ... on DrawCardsSpellEffect {
                    count
                  }
                  ... on GainMagicSpellEffect {
                    perLap
                  }
                  ... on MultipleDiceSpellEffect {
                    count
                    turns
                  }
                  ... on FixedDiceSpellEffect {
                    value
                    turns
                  }
                  ... on DamageSpellEffect {
                    amount
                  }
                }
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
                bonusPerTerritory
              }
              ... on MatchTerrainSource {
                element
                level
                bonusPerLevel
              }
              ... on MatchItemSource {
                card {
                  id
                  name
                }
                attackModifier
                hitPointsModifier
              }
              ... on MatchAbilitySource {
                ability
                battleModifier {
                  attackModifier
                  hitPointsModifier
                }
                battleRandomStats {
                  minimum
                  maximum
                }
              }
            }
          }
          ... on MatchBattleAbilityActivatedEvent {
            side
            ability
          }
          ... on MatchCreatureStruckEvent {
            striker
            attack
            damage
            remainingHitPoints
          }
          ... on MatchTerritoryConqueredEvent {
            participant
            position {
              x
              y
            }
            creature
            territoryHitPoints
          }
          ... on MatchInvasionRepelledEvent {
            participant
            territoryHitPoints
            returnedTo {
              x
              y
            }
            returnedHitPoints
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
                itemRestrictions
                placementRestrictions
                abilities {
                  kind
                  ... on CreatureTollMultiplierAbility {
                    percent
                  }
                  ... on CreatureBattleModifierAbility {
                    attackModifier
                    hitPointsModifier
                  }
                  ... on CreatureBattleRandomStatsAbility {
                    minimum
                    maximum
                  }
                  ... on CreatureAttackImmunityAbility {
                    elements
                  }
                }
              }
              ... on ItemCardInfo {
                category
                attackModifier
                hitPointsModifier
              }
              ... on SpellCardInfo {
                effect {
                  __typename
                  ... on DrawCardsSpellEffect {
                    count
                  }
                  ... on GainMagicSpellEffect {
                    perLap
                  }
                  ... on MultipleDiceSpellEffect {
                    count
                    turns
                  }
                  ... on FixedDiceSpellEffect {
                    value
                    turns
                  }
                  ... on DamageSpellEffect {
                    amount
                  }
                }
              }
            }
            returnedToHand
          }
          ... on MatchTollMultiplierActivatedEvent {
            position {
              x
              y
            }
            percent
            toll
            multipliedToll
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
          ... on MatchCreatureMovedEvent {
            participant
            from {
              x
              y
            }
            to {
              x
              y
            }
            creature
          }
          ... on MatchTerritoryInvadedByMoveEvent {
            participant
            from {
              x
              y
            }
            position {
              x
              y
            }
            creature
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
                itemRestrictions
                placementRestrictions
                abilities {
                  kind
                  ... on CreatureTollMultiplierAbility {
                    percent
                  }
                  ... on CreatureBattleModifierAbility {
                    attackModifier
                    hitPointsModifier
                  }
                  ... on CreatureBattleRandomStatsAbility {
                    minimum
                    maximum
                  }
                  ... on CreatureAttackImmunityAbility {
                    elements
                  }
                }
              }
              ... on ItemCardInfo {
                category
                attackModifier
                hitPointsModifier
              }
              ... on SpellCardInfo {
                effect {
                  __typename
                  ... on DrawCardsSpellEffect {
                    count
                  }
                  ... on GainMagicSpellEffect {
                    perLap
                  }
                  ... on MultipleDiceSpellEffect {
                    count
                    turns
                  }
                  ... on FixedDiceSpellEffect {
                    value
                    turns
                  }
                  ... on DamageSpellEffect {
                    amount
                  }
                }
              }
            }
            defendingCreatureCard {
              name
            }
          }
          ... on MatchLandElementChangedEvent {
            participant
            position {
              x
              y
            }
            element
            magic
            baseLandValue
            multiplier
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
                itemRestrictions
                placementRestrictions
                abilities {
                  kind
                  ... on CreatureTollMultiplierAbility {
                    percent
                  }
                  ... on CreatureBattleModifierAbility {
                    attackModifier
                    hitPointsModifier
                  }
                  ... on CreatureBattleRandomStatsAbility {
                    minimum
                    maximum
                  }
                  ... on CreatureAttackImmunityAbility {
                    elements
                  }
                }
              }
              ... on ItemCardInfo {
                category
                attackModifier
                hitPointsModifier
              }
              ... on SpellCardInfo {
                effect {
                  __typename
                  ... on DrawCardsSpellEffect {
                    count
                  }
                  ... on GainMagicSpellEffect {
                    perLap
                  }
                  ... on MultipleDiceSpellEffect {
                    count
                    turns
                  }
                  ... on FixedDiceSpellEffect {
                    value
                    turns
                  }
                  ... on DamageSpellEffect {
                    amount
                  }
                }
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
                itemRestrictions
                placementRestrictions
                abilities {
                  kind
                  ... on CreatureTollMultiplierAbility {
                    percent
                  }
                  ... on CreatureBattleModifierAbility {
                    attackModifier
                    hitPointsModifier
                  }
                  ... on CreatureBattleRandomStatsAbility {
                    minimum
                    maximum
                  }
                  ... on CreatureAttackImmunityAbility {
                    elements
                  }
                }
              }
              ... on ItemCardInfo {
                category
                attackModifier
                hitPointsModifier
              }
              ... on SpellCardInfo {
                effect {
                  __typename
                  ... on DrawCardsSpellEffect {
                    count
                  }
                  ... on GainMagicSpellEffect {
                    perLap
                  }
                  ... on MultipleDiceSpellEffect {
                    count
                    turns
                  }
                  ... on FixedDiceSpellEffect {
                    value
                    turns
                  }
                  ... on DamageSpellEffect {
                    amount
                  }
                }
              }
            }
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
            dice
            spellEffect {
              __typename
              ... on MultipleDiceSpellEffect {
                count
                turns
              }
              ... on FixedDiceSpellEffect {
                value
                turns
              }
            }
          }
          ... on MatchSpellEffectStartedEvent {
            participant
            target
            effect {
              remainingTurns
              effect {
                __typename
                ... on MultipleDiceSpellEffect {
                  count
                  turns
                }
                ... on FixedDiceSpellEffect {
                  value
                  turns
                }
              }
            }
          }
          ... on MatchSpellEffectEndedEvent {
            participant
          }
          ... on MatchCreatureDamagedEvent {
            participant
            position {
              x
              y
            }
            creature
            damage
            remainingHitPoints
          }
          ... on MatchCreatureDestroyedEvent {
            participant
            position {
              x
              y
            }
            creature
          }
          ... on MatchMagicGainedEvent {
            participant
            magic
            laps
            magicPerLap
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
