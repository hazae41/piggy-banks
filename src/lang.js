import React, { useState, useEffect, useMemo } from "react";

export const useLang = lang => {
  return useMemo(() => langs[lang] || langs.en, [lang]);
};

const langs = {
  en: {
    search: {
      placeholder: "Search for a piggy bank",
      connect: "Connect",
      create: "Create"
    },
    list: {
      onlyMine: "Only mine",
      all: "All piggy banks",
      mine: "My piggy banks"
    },
    bottom: {
      offline: "You are offline",
      settings: "Settings",
      help: "Help",
      source: "Source code"
    },
    notif: {
      created: `Created! You can now send stuff there`,
      rename: name => `Renamed to "${name}"`,
      transferred: owner => `Transferred to ${owner}`,
      tokenAdded: symbol => `Token ${symbol} has been added`,
      freed: `Freed!`,
      received: (sender, ethers) => `Received ${ethers} ethers from ${sender}`,
      update: ["Reload", "An update is available"]
    },
    create: {
      title: "Create a new piggy bank",
      name: "Name",
      defname: "My piggy bank 🐷",
      toolong: "This name is too long",
      create: "Create",
      price: price => `Ξ${price} + gas fees`
    },
    rename: {
      title: old => `Rename "${old}"`,
      name: "Name",
      toolong: "This name is too long"
    },
    transfer: {
      title: name => `Transfer "${name}"`,
      target: "New owner",
      transfer: "Transfer"
    },
    tokens: {
      title: "Tokens",
      address: "Token address",
      add: "Add a token",
      ethers: network => `Ethers on the ${network} network`,
      notConnected: "You must be connected to add a token",
      notToken: network =>
        `This address is not a token on the ${network} network`
    },
    collectibles: {
      title: "Collectibles",
      name: "A collectible",
      id: id => "#" + id
    },
    bank: {
      copy: "Copy address",
      share: "Share",
      view: "View on Etherscan",
      rename: "Rename",
      free: "Free",
      transfer: "Transfer"
    },
    logs: {
      title: "Logs",
      created: "Was created by:",
      received: "Received ethers from:",
      transferred: "Has been transferred to:"
    },
    settings: {
      title: "Settings",
      lang: "Language",
      gasPrice: "Gas price"
    }
  },
  fr: {
    search: {
      placeholder: "Rechercher une tirelire",
      connect: "Se connecter",
      create: "Créer une tirelire"
    },
    list: {
      onlyMine: "Seulement les miennes",
      all: "Toutes les tirelires",
      mine: "Mes tirelires"
    },
    bottom: {
      offline: "Vous êtes hors-ligne",
      settings: "Paramètres",
      help: "Aide",
      source: "Code source"
    },
    notif: {
      created: `Créée ! Vous pouvez maintenant y envoyer des choses`,
      rename: name => `Renommée "${name}"`,
      transferred: owner => `Transféré à ${owner}`,
      tokenAdded: symbol => `Le jeton ${symbol} a été ajouté`,
      freed: `Libéré !`,
      received: (sender, ethers) => `Reçu ${ethers} ethers depuis ${sender}`,
      update: ["Recharger", "Une nouvelle version est disponible"]
    },
    create: {
      title: "Créer une nouvelle tirelire",
      name: "Nom",
      defname: "Ma tirelire 🐷",
      toolong: "Ce nom est trop long",
      create: "Créer",
      price: price => `${price}Ξ + frais de transaction`
    },
    rename: {
      title: old => `Renommer "${old}"`,
      name: "Nom",
      toolong: "Ce nom est trop long"
    },
    transfer: {
      title: name => `Transférer "${name}"`,
      target: "Nouveau propriétaire",
      transfer: "Transférer"
    },
    tokens: {
      title: "Jetons",
      address: "Adresse du jeton",
      add: "Ajouter un jeton",
      ethers: network =>
        `Ethers sur le réseau ${network === "main" ? "principal" : network}`,
      notConnected: "Vous devez être connecté pour ajouter un jeton",
      notToken: network =>
        `Cette adresse n'est pas un jeton sur le réseau ${
          network === "main" ? "principal" : network
        }`
    },
    collectibles: {
      title: "Collections",
      name: "Une collection",
      id: id => "#" + id
    },
    bank: {
      copy: "Copier l'adresse",
      share: "Partager",
      view: "Voir sur Etherscan",
      rename: "Renommer",
      free: "Libérer",
      transfer: "Transférer"
    },
    logs: {
      title: "Historique",
      created: "A été créée par:",
      received: "A reçu des ethers de:",
      transferred: "A été transférée à:"
    },
    settings: {
      title: "Paramètres",
      lang: "Langue",
      gasPrice: "Prix du gaz"
    }
  }
};
