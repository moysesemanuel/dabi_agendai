"use client";

import { useEffect, useState } from "react";
import {
  defaultSiteConfig,
  fetchSiteConfig,
  SITE_CONFIG_UPDATED_EVENT,
} from "@/components/shared/site-config";

export function useSiteConfig() {
  const [config, setConfig] = useState(defaultSiteConfig);

  useEffect(() => {
    let active = true;

    function load() {
      fetchSiteConfig().then((next) => {
        if (active) {
          setConfig(next);
        }
      });
    }

    load();
    window.addEventListener(SITE_CONFIG_UPDATED_EVENT, load);

    return () => {
      active = false;
      window.removeEventListener(SITE_CONFIG_UPDATED_EVENT, load);
    };
  }, []);

  return config;
}
