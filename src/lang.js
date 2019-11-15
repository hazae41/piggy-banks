import { useState, useEffect, useMemo } from "react";

export const useLang = lang => {
  return useMemo(() => langs[lang], [lang]);
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
      received: (sender, ethers) => `Received ${ethers} ethers from ${sender}`
    },
    create: {
      title: "Create a new piggy bank",
      name: "Name",
      defname: "My piggy bank 🐷",
      toolong: "This name is too long",
      create: "Create",
      price: price => `${price} mΞ + gas fees`
    },
    rename: {
      title: old => `Rename "${old}"`,
      name: "Name",
      toolong: "This name is too long"
    },
    transfer: {
      title: name => `Transfer "${name}"`,
      target: "New owner",
      tranfer: "Transfer"
    },
    tokens: {
      title: "Tokens",
      address: "Token address",
      add: "Add this token",
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
      received: (sender, ethers) => `Reçu ${ethers} ethers depuis ${sender}`
    },
    create: {
      title: "Créer une nouvelle tirelire",
      name: "Nom",
      defname: "Ma tirelire 🐷",
      toolong: "Ce nom est trop long",
      create: "Créer",
      price: price => `${price} mΞ + frais de transaction`
    },
    rename: {
      title: old => `Renommer "${old}"`,
      name: "Nom",
      toolong: "Ce nom est trop long"
    },
    transfer: {
      title: name => `Transférer "${name}"`,
      target: "Nouveau propriétaire",
      tranfer: "Transférer"
    },
    tokens: {
      title: "Jetons",
      address: "Adresse du jeton",
      add: "Ajouter ce jeton",
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
    settings: {
      title: "Paramètres",
      lang: "Langage",
      gasPrice: "Prix du gaz"
    }
  }
};
