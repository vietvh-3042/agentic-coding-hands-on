import axios from "axios";

/** Shared browser HTTP client for feature API adapters. */
export const httpClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});
