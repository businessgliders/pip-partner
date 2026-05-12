import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

const CITIES_BY_PROVINCE = {
  Alberta: ["Calgary, AB", "Edmonton, AB", "Airdrie, AB", "Red Deer, AB", "Sherwood Park, AB"],
  "British Columbia": ["Vancouver, BC", "Burnaby, BC", "Richmond, BC", "Victoria, BC", "Surrey, BC", "Kelowna, BC"],
  Manitoba: ["Winnipeg, MB", "Brandon, MB", "Steinbach, MB"],
  "New Brunswick": ["Moncton, NB", "Saint John, NB", "Fredericton, NB"],
  "Newfoundland and Labrador": ["St. John's, NL", "Mount Pearl, NL", "Corner Brook, NL"],
  "Nova Scotia": ["Halifax, NS", "Dartmouth, NS", "Sydney, NS"],
  "Northwest Territories": ["Yellowknife, NT"],
  Nunavut: ["Iqaluit, NU"],
  Ontario: ["Vaughan, ON", "Oakville, ON", "Burlington, ON", "Mississauga, ON", "Markham, ON", "Ottawa, ON", "London, ON", "Hamilton, ON", "Kitchener, ON"],
  "Prince Edward Island": ["Charlottetown, PE", "Summerside, PE"],
  Quebec: ["Montreal, QC", "Quebec City, QC", "Laval, QC", "Gatineau, QC", "Longueuil, QC"],
  Saskatchewan: ["Saskatoon, SK", "Regina, SK", "Prince Albert, SK"],
  Yukon: ["Whitehorse, YT"],
};

const DEFAULT_CITIES = ["Toronto, ON", "Vancouver, BC", "Calgary, AB", "Montreal, QC", "Ottawa, ON", "Edmonton, AB", "Winnipeg, MB", "Halifax, NS"];

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