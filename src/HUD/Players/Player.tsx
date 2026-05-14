import * as I from "csgogsi";
import Weapon from "./../Weapon/Weapon";
import Avatar from "./Avatar";
import Armor from "./../Indicators/Armor";
import Bomb from "./../Indicators/Bomb";
import Defuse from "./../Indicators/Defuse";
import React from "react";
import { Kills, Skull } from "../../assets/Icons";

interface IProps {
  player: I.Player;
  isObserved: boolean;
}

const compareWeapon = (weaponOne: I.WeaponRaw, weaponTwo: I.WeaponRaw) => {
  if (
    weaponOne.name === weaponTwo.name &&
    weaponOne.paintkit === weaponTwo.paintkit &&
    weaponOne.type === weaponTwo.type &&
    weaponOne.ammo_clip === weaponTwo.ammo_clip &&
    weaponOne.ammo_clip_max === weaponTwo.ammo_clip_max &&
    weaponOne.ammo_reserve === weaponTwo.ammo_reserve &&
    weaponOne.state === weaponTwo.state
  )
    return true;

  return false;
};

const compareWeapons = (
  weaponsObjectOne: I.Weapon[],
  weaponsObjectTwo: I.Weapon[]
) => {
  const weaponsOne = [...weaponsObjectOne].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const weaponsTwo = [...weaponsObjectTwo].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  if (weaponsOne.length !== weaponsTwo.length) return false;

  return weaponsOne.every((weapon, i) => compareWeapon(weapon, weaponsTwo[i]));
};

const arePlayersEqual = (playerOne: I.Player, playerTwo: I.Player) => {
  if (
    playerOne.name === playerTwo.name &&
    playerOne.steamid === playerTwo.steamid &&
    playerOne.observer_slot === playerTwo.observer_slot &&
    playerOne.defaultName === playerTwo.defaultName &&
    playerOne.clan === playerTwo.clan &&
    playerOne.stats.kills === playerTwo.stats.kills &&
    playerOne.stats.assists === playerTwo.stats.assists &&
    playerOne.stats.deaths === playerTwo.stats.deaths &&
    playerOne.stats.mvps === playerTwo.stats.mvps &&
    playerOne.stats.score === playerTwo.stats.score &&
    playerOne.state.health === playerTwo.state.health &&
    playerOne.state.armor === playerTwo.state.armor &&
    playerOne.state.helmet === playerTwo.state.helmet &&
    playerOne.state.defusekit === playerTwo.state.defusekit &&
    playerOne.state.flashed === playerTwo.state.flashed &&
    playerOne.state.smoked === playerTwo.state.smoked &&
    playerOne.state.burning === playerTwo.state.burning &&
    playerOne.state.money === playerTwo.state.money &&
    playerOne.state.round_killhs === playerTwo.state.round_killhs &&
    playerOne.state.round_kills === playerTwo.state.round_kills &&
    playerOne.state.round_totaldmg === playerTwo.state.round_totaldmg &&
    playerOne.state.equip_value === playerTwo.state.equip_value &&
    playerOne.state.adr === playerTwo.state.adr &&
    playerOne.avatar === playerTwo.avatar &&
    !!playerOne.team.id === !!playerTwo.team.id &&
    playerOne.team.side === playerTwo.team.side &&
    playerOne.country === playerTwo.country &&
    playerOne.realName === playerTwo.realName &&
    compareWeapons(playerOne.weapons, playerTwo.weapons)
  )
    return true;

  return false;
};
const Player = ({ player, isObserved }: IProps) => {
  const weapons = player.weapons.map((weapon) => ({
    ...weapon,
    name: weapon.name.replace("weapon_", ""),
  }));
  const primary =
    weapons.filter(
      (weapon) =>
        !["C4", "Pistol", "Knife", "Grenade", undefined].includes(weapon.type)
    )[0] || null;
  const secondary =
    weapons.filter((weapon) => weapon.type === "Pistol")[0] || null;
  const grenades = weapons.filter((weapon) => weapon.type === "Grenade");
  const isLeft = player.team.orientation === "left";
  const zeus = weapons.find((weapon) => weapon.name === "taser") || null;

  return (
    <div
      className={`player ${player.state.health === 0 ? "dead" : ""} ${
        isObserved ? "active" : ""
      }`}
    >
      <div className="player_data">
        <div className="obs_slot">{player.observer_slot}</div>
        <div className="top_row">
          <Avatar
            teamId={player.team.id}
            steamid={player.steamid}
            height={57}
            width={57}
            showSkull={false}
            showCam={false}
            sidePlayer={true}
            teamSide={player.team.side}
          />
          <div className="username_money">
            <div className="username">{player.name}</div>
            <div className="money">${player.state.money}</div>
          </div>
          <div className="player-stats">
            <div className="statistics">
              <div className="player-kills">
                <Kills />
                <div className="stat-value">{player.stats.kills}</div>
              </div>
              <div className="player-deaths">
                <Skull />
                <div className="stat-value">{player.stats.deaths}</div>
              </div>
              {player.state.round_kills > 0 && (
                <div className="roundkills">{player.state.round_kills}</div>
              )}
            </div>
          </div>
          <div className="defuser_bomb">
            <Bomb player={player} />
            <Defuse player={player} />
          </div>
        </div>
        <div className="bottom_row">
          <div className="round_damage">
            ROUND DMG: {player.state.round_totaldmg}
          </div>
          <div
            className="hp_redbar"
            style={{ width: `${player.state.health}%` }}
          />
          <div
            className="hp_bar"
            style={{ width: `${player.state.health}%` }}
          />
          <div className="health_armor">
            <div className="health">
              {player.state.health > 0 && player.state.health}
            </div>
            <Armor
              health={player.state.health}
              armor={player.state.armor}
              helmet={player.state.helmet}
            />
          </div>
          <div className="weapon_utility">
            <div className="grenades">
              {grenades.map((grenade) => [
                <Weapon
                  key={`${grenade.name}-${grenade.state}`}
                  weapon={grenade.name}
                  active={grenade.state === "active"}
                  isGrenade
                />,
                grenade.ammo_reserve === 2 ? (
                  <Weapon
                    key={`${grenade.name}-${grenade.state}-double`}
                    weapon={grenade.name}
                    active={false}
                    isGrenade
                  />
                ) : null,
              ])}
            </div>
            {primary || secondary || zeus ? (
              <Weapon
                weapon={
                  primary ? primary.name : secondary ? secondary.name : "zeus"
                }
                active={
                  primary
                    ? primary.state === "active"
                    : secondary
                    ? secondary.state === "active"
                    : zeus
                    ? zeus.state === "active"
                    : false
                }
              />
            ) : (
              ""
            )}
          </div>
        </div>
        <div className="active_border"></div>
      </div>
    </div>
  );
};

const arePropsEqual = (
  prevProps: Readonly<IProps>,
  nextProps: Readonly<IProps>
) => {
  if (prevProps.isObserved !== nextProps.isObserved) return false;

  return arePlayersEqual(prevProps.player, nextProps.player);
};

export default React.memo(Player, arePropsEqual);
//export default Player;
