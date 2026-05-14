import * as I from "csgogsi";
import { Timer } from "./MatchBar";
import TeamLogo from "./TeamLogo";
import PlantDefuse from "../Timers/PlantDefuse";
import { ONGSI } from "../../API/contexts/actions";
import WinAnnouncement from "./WinIndicator";
import { useState } from "react";

interface IProps {
  orientation: "left" | "right";
  timer: Timer | null;
  team: I.Team;
}

const getTeamNameFontSize = (teamName: string) => {
  const nameLength = Math.max(teamName.trim().length, 1);
  const estimatedSize = Math.floor(280 / nameLength);
  return Math.max(14, Math.min(28, estimatedSize));
};

const TeamScore = ({ orientation, timer, team }: IProps) => {
  const [show, setShow] = useState(false);
  const teamName = team?.name || "";
  const teamNameFontSize = getTeamNameFontSize(teamName);

  ONGSI(
    "roundEnd",
    (result) => {
      if (result.winner.orientation !== orientation) return;
      setShow(true);

      setTimeout(() => {
        setShow(false);
      }, 5000);
    },
    [orientation]
  );

  return (
    <>
      <div className={`team ${orientation}`}>
        <div className="team-name" style={{ fontSize: `${teamNameFontSize}px` }}>
          {teamName}
        </div>
        <TeamLogo team={team} />
      </div>
      <PlantDefuse timer={timer} side={orientation} />
      <WinAnnouncement team={team} show={show} />
    </>
  );
};

export default TeamScore;
