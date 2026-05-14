import React from "react";
import { ArmorFull, ArmorHelmet, ArmorHalf, ArmorHalfHelmet } from "../../assets/Icons";

const Armor = ({
  health,
  armor,
  helmet,
}: {
  health: number;
  armor: number;
  helmet: boolean;
}) => {
  if (!health || !armor) return null;
  return (
    <div className={`armor_indicator`}>
      {helmet 
        ? armor >= 50 
        ? <ArmorHelmet /> 
        : <ArmorHalfHelmet />  
      : armor >= 50 
        ? <ArmorFull /> 
        : armor != 0
          ? <ArmorHalf />
          : null}
    </div>
  );
};

export default React.memo(Armor);
