const LOCAL_DATE_TIME=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function partsAt(date:Date,timeZone:string){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date);
 const get=(t:Intl.DateTimeFormatPartTypes)=>Number(parts.find(p=>p.type===t)?.value);
 return {year:get("year"),month:get("month"),day:get("day"),hour:get("hour"),minute:get("minute"),second:get("second")};
}

export function churchLocalDateTimeToIso(value:string,timeZone:string){
 const m=LOCAL_DATE_TIME.exec(value);
 if(!m)throw new Error("Invalid local date/time");
 const wanted={year:+m[1],month:+m[2],day:+m[3],hour:+m[4],minute:+m[5],second:+(m[6]??0)};
 // Validate timezone before doing arithmetic.
 new Intl.DateTimeFormat("en-US",{timeZone}).format(new Date());
 let guess=Date.UTC(wanted.year,wanted.month-1,wanted.day,wanted.hour,wanted.minute,wanted.second);
 const wantedEpoch=Date.UTC(wanted.year,wanted.month-1,wanted.day,wanted.hour,wanted.minute,wanted.second);
 for(let i=0;i<3;i++){
  const p=partsAt(new Date(guess),timeZone);
  const represented=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);
  const delta=wantedEpoch-represented;
  guess+=delta;
  if(delta===0)break;
 }
 const result=new Date(guess);
 const check=partsAt(result,timeZone);
 if(Object.keys(wanted).some(k=>check[k as keyof typeof check]!==wanted[k as keyof typeof wanted]))throw new Error("Local time does not exist in church timezone");
 return result.toISOString();
}
