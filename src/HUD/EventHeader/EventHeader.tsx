import { useEffect, useState } from "react";
import api from "../../API";
import { Tournament } from "../../API/types";
import "./eventheader.scss";

type TournamentResponse = Tournament | { tournament: Tournament | null } | null;

const getTournament = (response: TournamentResponse) => {
  if (!response) return null;
  if ("tournament" in response) return response.tournament;
  return response;
};

const getLogoSrc = (logo: string) => {
  if (!logo) return "";
  if (
    logo.startsWith("data:") ||
    logo.startsWith("http") ||
    logo.startsWith("/")
  ) {
    return logo;
  }
  return `data:image/jpeg;base64,${logo}`;
};

const EventHeader = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    api.tournaments
      .get()
      .then((response) => setTournament(getTournament(response)))
      .catch(() => setTournament(null));
  }, []);

  if (!tournament) return null;

  const phaseLabel = tournament.phase || tournament.stage || "Main event";
  const logoSrc = getLogoSrc(tournament.logo);

  return (
    <div className="event_header">
      <span className="event_name">{tournament.name}</span>
      {logoSrc ? <img src={logoSrc} alt={tournament.name} /> : null}
      <span className="event_phase">{phaseLabel}</span>
    </div>
  );
};

export default EventHeader;
