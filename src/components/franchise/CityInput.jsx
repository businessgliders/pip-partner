import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

const CITIES_BY_PROVINCE = {
  Ontario: ["Vaughan, ON", "Oakville, ON", "Burlington, ON", "Mississauga, ON", "Markham, ON", "Ottawa, ON", "London, ON", "Hamilton, ON", "Kitchener, ON"],
  "British Columbia": ["Vancouver, BC", "Burnaby, BC", "Richmond, BC", "Victoria, BC", "Surrey, BC", "Kelowna, BC"],
  Alberta: ["Calgary, AB", "Edmonton, AB", "Airdrie, AB", "Red Deer, AB", "Sherwood Park, AB"],
};

const DEFAULT_CITIES = ["Vaughan, ON", "Vancouver, BC", "Calgary, AB", "Oakville, ON"];

export default function CityInput({ value, onChange, province, className }) {
  const cities = province && CITIES_BY_PROVINCE[province] ? CITIES_BY_PROVINCE[province] : DEFAULT_CITIES;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [province]);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % cities.length);
    }, 2200);
    return () => clearInterval(id);
  }, [cities]);

  return (
    <Input
      placeholder={`e.g. ${cities[index]}`}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  );
}