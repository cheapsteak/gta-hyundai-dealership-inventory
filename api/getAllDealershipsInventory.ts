import fetch from "node-fetch";
import querystring from "querystring";
import { NowRequest, NowResponse } from "@vercel/node";

import {
  Dealership,
  EdealerItemEntry,
  EdealerVehicleCompareArray,
  WPResponse,
} from "@local/types";

import { dealerships } from "./dealerships";

export async function getAllDealershipsInventory() {
  return await Promise.all(
    dealerships.map(async (dealership) => {
      return {
        ...dealership,
        inventory: await fetchDealershipInventory(dealership),
      };
    })
  );
}

const fetchDealershipInventory = (dealership: Dealership) => {
  switch (dealership.website.type) {
    case "edealer":
      return fetchFromEdealer(
        dealership.website.url,
        dealership.website.requestUrl
      );
    case "wordpress":
      return fetchFromWP(dealership.website.url, dealership.website.cp);
  }
};

const fetchFromWP = async function (websiteUrl: string, cp: string) {
  const response = await fetch(
    `${websiteUrl}wp-content/plugins/convertus-vms/include/php/ajax-vehicles.php`,
    {
      headers: {
        accept: "*/*",
        "accept-language":
          "en-CA,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,en-GB;q=0.6,en-US;q=0.5",
        "content-type": "application/x-www-form-urlencoded",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
      },
      body: querystring.stringify({
        action: "vms_data",
        endpoint: `https://vms.prod.convertus.rocks/api/filtering/?${querystring.stringify(
          {
            cp,
            ln: "en",
            pg: "1",
            pc: "1000",
            dc: "true",
            qs: "",
            im: "true",
            sc: "new",
            // "v1": "Passenger Vehicles",
            st: "",
            // ai: "true",
            oem: "Hyundai",
            yr: "2021,2021",
            mk: "",
            md: "Elantra,Sonata",
            tr: "",
            bs: "",
            tm: "",
            dt: "",
            cy: "",
            ec: "",
            mc: "",
            ic: "",
            pa: "",
            ft: "",
            eg: "",
            v2: "",
            v3: "",
            fp: "",
            fc: "",
            fn: "",
            tg: "",
          }
        )}`,
      }),
      // "action=vms_data&endpoint=https://vms.prod.convertus.rocks/api/filtering/?cp=2353&ln=en&pg=1&pc=12&dc=true&qs=&im=true&sc=new&v1=Passenger%20Vehicles&st=&ai=true&oem=Hyundai&yr=2021%2C2021&mk=&md=Elantra%2CSonata&tr=&bs=&tm=&dt=&cy=&ec=&mc=&ic=&pa=&ft=&eg=&v2=&v3=&fp=&fc=&fn=&tg="
      method: "POST",
    }
  );
  const json: WPResponse = await response.json();
  // console.log("json", json);
  return json.results.map((result) => ({
    id: result.vehicle_id.toString(),
    vin: result.vin,
    model: result.model,
    year: result.year,
    trim: result.trim,
    url: result.vdp_url,
    msrp: result.msrp,
    days_on_lot: result.days_on_lot,
    exterior_color: result.manu_exterior_color,
    freight: undefined,
  }));
};

const fetchFromEdealer = async function (
  websiteUrl: string,
  requestUrl?: string
) {
  let response = await fetch(
    requestUrl ??
      `${websiteUrl}new/year/2021/make/Hyundai/body/Sedan/mo/Sonata%7CElantra/s/year/o/desc`,
    {
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-requested-with": "XMLHttpRequest",
      },
      body: "ajax=true&refresh=true",
      method: "POST",
    }
  );

  const json = await response.json();
  const vehicleCompareArray: EdealerItemEntry[] = Object.values(
    JSON.parse(json.vehicleCompareArray) as EdealerVehicleCompareArray
  );

  // console.log(
  //   "edealer json",
  //   Object.keys(JSON.parse(json.vehicleCompareArray))
  // );

  return vehicleCompareArray.map((item) => {
    const parsedAge = parseInt(item.age, 10);
    return {
      id: item.vehicleId,
      vin: item.vin,
      model: item.model,
      year: Number(item.year),
      trim: item.trim,
      url: `${websiteUrl}${item.detailUrl}`,
      exterior_color: item.exteriorColour,
      msrp: item.msrp,
      freight: item.freight,
      days_on_lot: Number.isNaN(parsedAge) ? undefined : parsedAge,
    };
  });
};

export default async function (req: NowRequest, res: NowResponse) {
  res.json(await getAllDealershipsInventory());
}
