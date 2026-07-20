export interface CategoryHubItem {
  label: string;
  href: string;
  image: string;
  letter: string;
}

export interface CategoryHub {
  title: string;
  description: string;
  image: string;
  eyebrow: string;
  items: CategoryHubItem[];
}

export const categoryHubs: Record<string, CategoryHub> = {
  "decoratie": {
    "title": "Decoratie",
    "description": "Voor al je prachtige decoraties moet je hier terecht. We hebben verschillende soorten wanddecoraties en nog veel meer op een rijtje gezet. Bekijk ze maar hier.",
    "image": "/images/2023/05/wanddecoratie.jpg",
    "eyebrow": "Categorie",
    "items": [
      {
        "label": "boekensteun",
        "href": "/beste-boekensteun/",
        "image": "https://media.s-bol.com/mG6Br3Nx9KYG/ZY6J2Y8/550x570.jpg",
        "letter": "B"
      },
      {
        "label": "decoratie ladder",
        "href": "/beste-decoratie-ladder/",
        "image": "https://media.s-bol.com/ql0n25o9XxBr/311x840.jpg",
        "letter": "D"
      },
      {
        "label": "dierenhoofd",
        "href": "/beste-dierenhoofd/",
        "image": "https://media.s-bol.com/xLzz7Am8xoKE/46Y3pY7/506x840.jpg",
        "letter": "D"
      },
      {
        "label": "digitale fotolijst",
        "href": "/beste-digitale-fotolijst/",
        "image": "https://media.s-bol.com/NKo1NNo9GE6K/y2gGRn/550x374.jpg",
        "letter": "D"
      },
      {
        "label": "dromenvanger",
        "href": "/beste-dromenvanger/",
        "image": "https://media.s-bol.com/kDgZZ3BjAZ3K/p8YnR81/550x550.jpg",
        "letter": "D"
      },
      {
        "label": "fotolijstplank",
        "href": "/beste-fotolijstplank/",
        "image": "https://media.s-bol.com/JlWODKqAgplK/G5yywAy/550x466.jpg",
        "letter": "F"
      },
      {
        "label": "fotoslinger",
        "href": "/beste-fotoslinger/",
        "image": "https://media.s-bol.com/7DPGwWrZqml1/VmLGE7B/550x524.jpg",
        "letter": "F"
      },
      {
        "label": "geurbrander",
        "href": "/beste-geurbrander/",
        "image": "https://media.s-bol.com/4KNpgv9APNLV/mEWgXp/550x550.jpg",
        "letter": "G"
      },
      {
        "label": "geurstokje",
        "href": "/beste-geurstokje/",
        "image": "https://media.s-bol.com/YQrj7V3KOp7O/qj2DGk3/550x504.jpg",
        "letter": "G"
      },
      {
        "label": "geurzakje",
        "href": "/beste-geurzakje/",
        "image": "https://media.s-bol.com/mX79YzlJNQO3/D94lEA/550x550.jpg",
        "letter": "G"
      },
      {
        "label": "kussenhoesje",
        "href": "/beste-kussenhoesje/",
        "image": "https://media.s-bol.com/gJ5gn9rX39GD/550x535.jpg",
        "letter": "K"
      },
      {
        "label": "letterbak",
        "href": "/beste-letterbak/",
        "image": "https://media.s-bol.com/K79j8W1A5oxJ/o7jkPL/550x575.jpg",
        "letter": "L"
      },
      {
        "label": "letterbord",
        "href": "/beste-letterbord/",
        "image": "https://media.s-bol.com/N5QjvR51Xr1p/yrYv9D6/550x820.jpg",
        "letter": "L"
      },
      {
        "label": "lightbox",
        "href": "/beste-lightbox/",
        "image": "https://media.s-bol.com/7nDP73R3xpOy/550x550.jpg",
        "letter": "L"
      },
      {
        "label": "passpiegel",
        "href": "/beste-passpiegel/",
        "image": "https://media.s-bol.com/kB46gP0YDXzN/GR5qVy7/550x550.jpg",
        "letter": "P"
      },
      {
        "label": "plaid",
        "href": "/beste-plaid/",
        "image": "https://media.s-bol.com/mqZnQl1qy62n/550x321.jpg",
        "letter": "P"
      },
      {
        "label": "plakspiegel",
        "href": "/beste-plakspiegel/",
        "image": "https://media.s-bol.com/DZD5LByjBYBy/KEnY4n/550x587.jpg",
        "letter": "P"
      },
      {
        "label": "sierkussen",
        "href": "/beste-sierkussen/",
        "image": "https://media.s-bol.com/NKKQ6BXgG7rN/n8JjNl/550x546.jpg",
        "letter": "S"
      },
      {
        "label": "spreuktegel",
        "href": "/beste-spreuktegel/",
        "image": "https://media.s-bol.com/qLxvmr6v4q4r/VvQYWp5/550x733.jpg",
        "letter": "S"
      },
      {
        "label": "staande spiegel",
        "href": "/beste-staande-spiegel/",
        "image": "https://media.s-bol.com/Kzq2D2yr6QXG/BrLlokQ/234x840.jpg",
        "letter": "S"
      },
      {
        "label": "tekstbord",
        "href": "/beste-tekstbord/",
        "image": "https://media.s-bol.com/qMX0jngR2Grp/XoPwjNA/456x840.jpg",
        "letter": "T"
      },
      {
        "label": "urn",
        "href": "/beste-urn/",
        "image": "https://media.s-bol.com/3J23Bp1kWrVx/Any2MB/550x550.jpg",
        "letter": "U"
      },
      {
        "label": "vloerkleed",
        "href": "/beste-vloerkleed/",
        "image": "https://media.s-bol.com/vlgYYy5QOYp5/550x541.jpg",
        "letter": "V"
      },
      {
        "label": "wandbord",
        "href": "/beste-wandbord/",
        "image": "https://media.s-bol.com/yAA1WA3vlXzV/g6XMkG/550x315.jpg",
        "letter": "W"
      },
      {
        "label": "wandbox",
        "href": "/beste-wandbox/",
        "image": "https://media.s-bol.com/ZBBN3l8YzXE/550x550.jpg",
        "letter": "W"
      },
      {
        "label": "wandkleed",
        "href": "/beste-wandkleed/",
        "image": "https://media.s-bol.com/qA0V839Kly6D/JZmBMMJ/550x741.jpg",
        "letter": "W"
      },
      {
        "label": "wandrek",
        "href": "/beste-wandrek/",
        "image": "https://media.s-bol.com/7JmXG4vzv13w/p2KMpX/550x733.jpg",
        "letter": "W"
      },
      {
        "label": "wandspiegel",
        "href": "/beste-wandspiegel/",
        "image": "https://media.s-bol.com/rX09RmXvjPRB/4RM4ywg/308x840.jpg",
        "letter": "W"
      },
      {
        "label": "wierook",
        "href": "/beste-wierook/",
        "image": "https://media.s-bol.com/Rk9NXXlw7xBq/w00zk9M/550x701.jpg",
        "letter": "W"
      },
      {
        "label": "zeemeermindeken",
        "href": "/beste-zeemeermindeken/",
        "image": "https://media.s-bol.com/xz8NlJL8gKQn/BRVRJx/550x550.jpg",
        "letter": "Z"
      },
      {
        "label": "zuil",
        "href": "/beste-zuil/",
        "image": "https://media.s-bol.com/N1BXkjr1gYnm/ng3EP4/434x840.jpg",
        "letter": "Z"
      }
    ]
  },
  "slaapruimte": {
    "title": "Slaapruimte",
    "description": "In de slaapruimte vind je producten die je nodig hebt in de slaapkamer zoals hoofdkussen, boxspring, een stapelbed en nog veel meer. Hier kun je ze allemaal bekijken.",
    "image": "/images/2023/05/meubels.jpg",
    "eyebrow": "Categorie",
    "items": [
      {
        "label": "4 seizoenen dekbed",
        "href": "/beste-4-seizoenen-dekbed/",
        "image": "https://media.s-bol.com/MB58AOJOzQqP/wmPANg/550x283.jpg",
        "letter": "#"
      },
      {
        "label": "boxspring",
        "href": "/beste-boxspring/",
        "image": "https://media.s-bol.com/RwvKMyPXmmjR/VA7QXxv/550x366.jpg",
        "letter": "B"
      },
      {
        "label": "dekbed",
        "href": "/beste-dekbed/",
        "image": "https://media.s-bol.com/x78vy1pnQ1Wn/9QG1jK3/550x331.jpg",
        "letter": "D"
      },
      {
        "label": "elektrische deken",
        "href": "/beste-elektrische-deken/",
        "image": "https://media.s-bol.com/YYBVlzZQnxN9/OqvDQY/550x643.jpg",
        "letter": "E"
      },
      {
        "label": "hoofdkussen",
        "href": "/beste-hoofdkussen/",
        "image": "https://media.s-bol.com/qxjowxK79XEk/550x412.jpg",
        "letter": "H"
      },
      {
        "label": "hoogslaper",
        "href": "/beste-hoogslaper/",
        "image": "https://media.s-bol.com/qAEk1vEgYY4r/k53G5vX/550x412.jpg",
        "letter": "H"
      },
      {
        "label": "kapstok",
        "href": "/beste-kapstok/",
        "image": "https://media.s-bol.com/YYypMKmyjZ9Y/0ADkGV/550x518.jpg",
        "letter": "K"
      },
      {
        "label": "kledingkast",
        "href": "/beste-kledingkast/",
        "image": "https://media.s-bol.com/xVmVLMxy8El3/jYv9nNl/550x560.jpg",
        "letter": "K"
      },
      {
        "label": "kluis",
        "href": "/beste-kluis/",
        "image": "https://media.s-bol.com/N922PWn2yq46/550x534.jpg",
        "letter": "K"
      },
      {
        "label": "matras",
        "href": "/beste-matras/",
        "image": "https://media.s-bol.com/29mJpgzrRGmM/550x198.jpg",
        "letter": "M"
      },
      {
        "label": "matrasbeschermer",
        "href": "/beste-matrasbeschermer/",
        "image": "https://media.s-bol.com/J66jAL0KO4jg/550x260.jpg",
        "letter": "M"
      },
      {
        "label": "mobiele airco",
        "href": "/beste-mobiele-airco/",
        "image": "https://media.s-bol.com/r9EOzp4OP0EW/333x840.jpg",
        "letter": "M"
      },
      {
        "label": "naaimachine",
        "href": "/beste-naaimachine/",
        "image": "https://media.s-bol.com/Rk4Q7DKXAN3w/vQZ4A6n/550x513.jpg",
        "letter": "N"
      },
      {
        "label": "paspop",
        "href": "/beste-paspop/",
        "image": "https://media.s-bol.com/x2V013Ww3j0r/210x840.jpg",
        "letter": "P"
      },
      {
        "label": "schoenenrek",
        "href": "/beste-schoenenrek/",
        "image": "https://media.s-bol.com/x8yAkRKvG5ZP/VALr9rW/544x840.jpg",
        "letter": "S"
      },
      {
        "label": "slaapbank",
        "href": "/beste-slaapbank/",
        "image": "https://media.s-bol.com/3rQxK9v1qxW4/QAkL0q/550x237.jpg",
        "letter": "S"
      },
      {
        "label": "stapelbed",
        "href": "/beste-stapelbed/",
        "image": "https://media.s-bol.com/xQLjWNGjEP3/550x420.jpg",
        "letter": "S"
      },
      {
        "label": "ventilator",
        "href": "/beste-ventilator/",
        "image": "https://media.s-bol.com/YQR5xmgPX5jA/8qXXAll/550x482.jpg",
        "letter": "V"
      },
      {
        "label": "verzwaringsdeken",
        "href": "/beste-verzwaringsdeken/",
        "image": "https://media.s-bol.com/x7o1LDj6WY1E/wmnGgo1/550x520.jpg",
        "letter": "V"
      },
      {
        "label": "vouwbed",
        "href": "/beste-vouwbed/",
        "image": "https://media.s-bol.com/NKGrB5WODo46/wZl8zw/343x840.jpg",
        "letter": "V"
      },
      {
        "label": "wekker",
        "href": "/beste-wekker/",
        "image": "https://media.s-bol.com/grO9J7rXRkY/550x709.jpg",
        "letter": "W"
      }
    ]
  },
  "woonkamer": {
    "title": "Woonkamer",
    "description": "Deze categorie bevat alles dat je nodig hebt als je een woonhuis of een ruimte wilt inrichten. Neem een kijkje in de lijst hieronder.",
    "image": "/images/2023/05/kussen-1024x1016.jpg",
    "eyebrow": "Categorie",
    "items": [
      {
        "label": "bijzettafel",
        "href": "/beste-bijzettafel/",
        "image": "https://media.s-bol.com/qAnK9pZ3Z7E2/y83DjjE/550x550.jpg",
        "letter": "B"
      },
      {
        "label": "binnenkussen",
        "href": "/beste-binnenkussen/",
        "image": "https://media.s-bol.com/7A93MMBEo2YQ/550x700.jpg",
        "letter": "B"
      },
      {
        "label": "boekenkast",
        "href": "/beste-boekenkast/",
        "image": "https://media.s-bol.com/N5JjypDJ3Xx6/jqwopGR/543x840.jpg",
        "letter": "B"
      },
      {
        "label": "boekenplank",
        "href": "/beste-boekenplank/",
        "image": "https://media.s-bol.com/qL1vozEZ6L2R/8BMZr/550x555.jpg",
        "letter": "B"
      },
      {
        "label": "deurmat",
        "href": "/beste-deurmat/",
        "image": "https://media.s-bol.com/mNXvg16vB6G0/nRNPXX7/472x840.jpg",
        "letter": "D"
      },
      {
        "label": "deurstopper",
        "href": "/beste-deurstopper/",
        "image": "https://media.s-bol.com/qAZYvvrX8OO0/zmDWvY7/550x670.jpg",
        "letter": "D"
      },
      {
        "label": "keukenklok",
        "href": "/beste-keukenklok/",
        "image": "https://media.s-bol.com/JPX9oVgyvvyK/550x551.jpg",
        "letter": "K"
      },
      {
        "label": "koekoeksklok",
        "href": "/beste-koekoeksklok/",
        "image": "https://media.s-bol.com/xlVggr41J3qq/482x840.jpg",
        "letter": "K"
      },
      {
        "label": "kussenvulling",
        "href": "/beste-kussenvulling/",
        "image": "https://media.s-bol.com/x25EpozmxVVJ/550x348.jpg",
        "letter": "K"
      },
      {
        "label": "paraplubak",
        "href": "/beste-paraplubak/",
        "image": "https://media.s-bol.com/qLMVMl4zZ610/vQm3qwn/550x550.jpg",
        "letter": "P"
      },
      {
        "label": "poef",
        "href": "/beste-poef/",
        "image": "https://media.s-bol.com/BOz63lOBMr8k/57LKE0v/550x688.jpg",
        "letter": "P"
      },
      {
        "label": "projectieklok",
        "href": "/beste-projectieklok/",
        "image": "https://media.s-bol.com/R5jkD74X3WBq/Oy6G1BN/550x550.jpg",
        "letter": "P"
      },
      {
        "label": "sleutelkastje",
        "href": "/beste-sleutelkastje/",
        "image": "https://media.s-bol.com/gMKQXNy2EJJZ/vQDznlL/550x463.jpg",
        "letter": "S"
      },
      {
        "label": "staande klok",
        "href": "/beste-staande-klok/",
        "image": "https://media.s-bol.com/JXGJKNwMlxlD/5lp8vR/550x724.jpg",
        "letter": "S"
      },
      {
        "label": "stoelkussen",
        "href": "/beste-stoelkussen/",
        "image": "https://media.s-bol.com/VPZ8KJg4qNOz/550x528.jpg",
        "letter": "S"
      },
      {
        "label": "tafelklok",
        "href": "/beste-tafelklok/",
        "image": "https://media.s-bol.com/738XXlmxJKNO/550x761.jpg",
        "letter": "T"
      },
      {
        "label": "tochtrol",
        "href": "/beste-tochtrol/",
        "image": "https://media.s-bol.com/m0mYZv0DRzDO/AOlD89/550x733.jpg",
        "letter": "T"
      },
      {
        "label": "tv meubel",
        "href": "/beste-tv-meubel/",
        "image": "https://media.s-bol.com/XX551BR3Zy2W/2GNx8N/550x335.jpg",
        "letter": "T"
      },
      {
        "label": "vloerkussen",
        "href": "/beste-vloerkussen/",
        "image": "https://media.s-bol.com/8O47YZkNPy85/YWr7wgp/550x623.jpg",
        "letter": "V"
      },
      {
        "label": "wandklok",
        "href": "/beste-wandklok/",
        "image": "https://media.s-bol.com/mNvEYlB4Zy5R/125Q3/550x570.jpg",
        "letter": "W"
      },
      {
        "label": "wereldklok",
        "href": "/beste-wereldklok/",
        "image": "https://media.s-bol.com/xLKl2OPXOk93/014O7/550x361.jpg",
        "letter": "W"
      },
      {
        "label": "zitzak",
        "href": "/beste-zitzak/",
        "image": "https://media.s-bol.com/g8qy0Dggvx9D/57yY7nZ/550x433.jpg",
        "letter": "Z"
      }
    ]
  },
  "verlichting": {
    "title": "Verlichting",
    "description": "Verlicht je woning en terras met onze geweldige lantaarn, olielamp of een dergelijk product. Deze vind je hier in de categorie verlichting.",
    "image": "/images/2023/05/verlichting.jpg",
    "eyebrow": "Categorie",
    "items": [
      {
        "label": "kaars",
        "href": "/beste-kaars/",
        "image": "https://media.s-bol.com/mXKlRgZxG42r/19XxkV/550x515.jpg",
        "letter": "K"
      },
      {
        "label": "kandelaar",
        "href": "/beste-kandelaar/",
        "image": "https://media.s-bol.com/JPJBpV1O50R2/518x840.jpg",
        "letter": "K"
      },
      {
        "label": "kroonluchter",
        "href": "/beste-kroonluchter/",
        "image": "https://media.s-bol.com/gMK6MKwjmorY/nR8PNpY/550x733.jpg",
        "letter": "K"
      },
      {
        "label": "lantaarn",
        "href": "/beste-lantaarn/",
        "image": "https://media.s-bol.com/YYlw8DAJO7LM/8Bo30r/550x595.jpg",
        "letter": "L"
      },
      {
        "label": "olielamp",
        "href": "/beste-olielamp/",
        "image": "https://media.s-bol.com/gk97M2xgJvJZ/441x840.jpg",
        "letter": "O"
      },
      {
        "label": "waxinelichthouder",
        "href": "/beste-waxinelichthouder/",
        "image": "https://media.s-bol.com/qAYYnAlMM2k3/76qP0Mw/550x577.jpg",
        "letter": "W"
      },
      {
        "label": "windlicht",
        "href": "/beste-windlicht/",
        "image": "https://media.s-bol.com/qp7YNLMDRWo7/nYnBD4/550x685.jpg",
        "letter": "W"
      }
    ]
  },
  "wasruimte": {
    "title": "Wasruimte",
    "description": "In de wasruimte kom je de meest belangrijke items tegen voor het schoonmaken van je woning en het onderhouden van je lichaam. Bekijk ze maar hieronder in de lijst.",
    "image": "/images/2023/05/meubels.jpg",
    "eyebrow": "Categorie",
    "items": [
      {
        "label": "douchekop",
        "href": "/beste-douchekop/",
        "image": "https://media.s-bol.com/BOgDkk26wqDJ/lxWL29M/550x606.jpg",
        "letter": "D"
      },
      {
        "label": "dressboy",
        "href": "/beste-dressboy/",
        "image": "https://media.s-bol.com/xjnXm7ER0L33/ZVZD6R/550x660.jpg",
        "letter": "D"
      },
      {
        "label": "kledingstomer",
        "href": "/beste-kledingstomer/",
        "image": "https://media.s-bol.com/34pKmW3ZLz9/231x840.jpg",
        "letter": "K"
      },
      {
        "label": "kruimeldief",
        "href": "/beste-kruimeldief/",
        "image": "https://media.s-bol.com/Rk4D0DzPWJ1q/gp2N6Wj/550x669.jpg",
        "letter": "K"
      },
      {
        "label": "robotstofzuiger",
        "href": "/beste-robotstofzuiger/",
        "image": "https://media.s-bol.com/JKWMGZR0V8Yv/2O7Q1v/550x452.jpg",
        "letter": "R"
      },
      {
        "label": "stoomreiniger",
        "href": "/beste-stoomreiniger/",
        "image": "https://media.s-bol.com/7JPR2PZr2pPr/09ygv3/550x549.jpg",
        "letter": "S"
      }
    ]
  },
  "tuin": {
    "title": "Tuin",
    "description": "Hier hebben we allerlei producten neergezet om de tuin te verfraaien en te onderhouden. Door te klikken op een item kun jezelf een vergelijking maken welke je wilt.",
    "image": "/images/2023/05/bloemen.jpg",
    "eyebrow": "Categorie",
    "items": [
      {
        "label": "bartafel",
        "href": "/beste-bartafel/",
        "image": "https://media.s-bol.com/6Ky01EE0p8mn/lRDNong/550x523.jpg",
        "letter": "B"
      },
      {
        "label": "bloempot",
        "href": "/beste-bloempot/",
        "image": "https://media.s-bol.com/L07vo8NORy5D/yoWvypE/550x572.jpg",
        "letter": "B"
      },
      {
        "label": "droogboeket",
        "href": "/beste-droogboeket/",
        "image": "https://media.s-bol.com/YMKkw6v7rBQW/550x621.jpg",
        "letter": "D"
      },
      {
        "label": "edelsteen",
        "href": "/beste-edelsteen/",
        "image": "https://media.s-bol.com/NWJwyyJJBPEz/4W5Ek/550x550.jpg",
        "letter": "E"
      },
      {
        "label": "hangstoel",
        "href": "/beste-hangstoel/",
        "image": "https://media.s-bol.com/g6PwqW4ZvrA6/1Wr15YP/399x840.jpg",
        "letter": "H"
      },
      {
        "label": "krans",
        "href": "/beste-krans/",
        "image": "https://media.s-bol.com/NKKgzA39JM46/mG8Nv0/550x550.jpg",
        "letter": "K"
      },
      {
        "label": "kunstbloem",
        "href": "/beste-kunstbloem/",
        "image": "https://media.s-bol.com/m7Eg1mz55YwE/qj0jzZy/550x733.jpg",
        "letter": "K"
      },
      {
        "label": "kunstplant",
        "href": "/beste-kunstplant/",
        "image": "https://media.s-bol.com/GzZAKyME1r5K/p8WzgO2/550x551.jpg",
        "letter": "K"
      }
    ]
  }
} satisfies Record<string, CategoryHub>;

export const categoryHubSlugs = Object.keys(categoryHubs);
