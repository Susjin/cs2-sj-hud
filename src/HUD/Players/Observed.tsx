import { useState } from "react";
import { Player } from "csgogsi";
import Weapon from "./../Weapon/Weapon";
import Avatar from "./Avatar";
import "./observed.scss";
import {
  ArmorHelmet,
  ArmorFull,
  HealthFull,
  Bullets,
} from "../../assets/Icons";
import { apiUrl } from "./../../API";
import { useAction } from "../../API/contexts/actions";
import Bomb from "../Indicators/Bomb";
import Defuse from "../Indicators/Defuse";

const Observed = ({ player }: { player: Player | null }) => {
  const [showCam, setShowCam] = useState(true);

  useAction("toggleCams", () => {
    setShowCam((p) => !p);
  });

  if (!player) return null;
  const currentWeapon = player.weapons.filter(
    (weapon) => weapon.state === "active"
  )[0];
  const knife =
    player.weapons.filter((weapon) => weapon.type === "Knife")[0] || null;
  const grenade =
    player.weapons.filter(
      (weapon) => weapon.type === "Grenade" && weapon.state === "active"
    )[0] || null;
  const healthbarWidth = { width: `${player.state.health}%` };

  return (
    <div className="observed_container">
      <div className={`avatar_holder ${player.team.side}`}>
        <Avatar
          teamId={player.team.id}
          steamid={player.steamid}
          height={140}
          width={140}
          showCam={showCam}
          slot={player.observer_slot}
          teamSide={player.team.side}
        />
      </div>
      <div className={`observed ${player.team.side}`}>
        <div className="health_row">
          <div className="health_armor_container">
            <div className="health-icon icon">
              <HealthFull />
            </div>
            <div className="health text">{player.state.health}</div>
            <div className="armor-icon icon">
              {player.state.helmet ? <ArmorHelmet /> : <ArmorFull />}
            </div>
          </div>
        </div>
        <div className="main_row">
          <div className="username_container">
            <div className="username">{player.name}</div>
          </div>
        </div>
        <div className="weapon_row">
          <div className="bomb_kit_container">
            <Bomb player={player} />
            <Defuse player={player} />
          </div>
          <div className="ammo_row">
            {currentWeapon ? (
              (() => {
                switch (currentWeapon.type) {
                  case "Knife":
                    return (
                      <div className="knife_holder">
                        <Weapon
                          active={knife.state === "active"}
                          weapon={knife.name}
                        />
                      </div>
                    );
                  case "Grenade":
                    return (
                      <div className="grenade_holder">
                        <Weapon
                          active={grenade.state === "active"}
                          weapon={grenade.name}
                        />
                      </div>
                    );
                  case "C4":
                    return null;
                  default:
                    return (
                      <div className="ammo">
                        <div className="ammo_counter">
                          <div className="ammo_clip">
                            {(currentWeapon && currentWeapon.ammo_clip) || "-"}
                          </div>
                          <div className="ammo_reserve">
                            /
                            {(currentWeapon && currentWeapon.ammo_reserve) ||
                              "0"}
                          </div>
                        </div>
                        <div className="ammo_icon_container">
                          <Bullets />
                        </div>
                      </div>
                    );
                }
              })()
            ) : (
              // When reloading
              <div className="ammo">
                <div className="ammo_counter">
                  <div className="ammo_clip">-</div>
                  <div className="ammo_reserve">/ -</div>
                </div>
                <div className="ammo_icon_container">
                  <Bullets />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={`healthbar-container ${player.team.side}`}>
        <div className="healthbar_holder">
          <div className="healthbar" style={healthbarWidth}></div>
        </div>
      </div>
    </div>
  );
};

export default Observed;
