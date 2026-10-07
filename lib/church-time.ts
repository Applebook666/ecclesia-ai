const LOCAL_DATE_TIME=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function partsAt(date:Date,timeZone:string){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date);
 const get=(t:Intl.DateTimeFormatPartTypes)=>Number(parts.find(p=>p.type===t)?.value);
 return {year:get("year"),month:get("month"),day:get("day"),hour:get("hour"),minute:get("minute"),second:get("second")};
}

function sameLocal(a:ReturnType<typeof partsAt>,b:ReturnType<typeof partsAt>){
 return a.year===b.year&&a.month===b.month&&a.day===b.day&&a.hour===b.hour&&a.minute===b.minute&&a.second===b.second;
}

export function churchLocalDateTimeToIso(value:string,timeZone:string){
 const m=LOCAL_DATE_TIME.exec(value);
 if(!m)throw new Error("Invalid local date/time");
 const wanted={year:+m[1],month:+m[2],day:+m[3],hour:+m[4],minute:+m[5],second:+(m[6]??0)};
 new Intl.DateTimeFormat("en-US",{timeZone}).format(new Date());

 const wantedEpoch=Date.UTC(wanted.year,wanted.month-1,wanted.day,wanted.hour,wanted.minute,wanted.second);
 const matches:number[]=[];
 // Search the practical UTC-offset range. Reject DST gaps and fall-back folds
 // rather than silently choosing the wrong service time.
 for(let offsetMinutes=-14*60;offsetMinutes<=14*60;offsetMinutes+=15){
  const candidate=wantedEpoch-offsetMinutes*60_000;
  if(sameLocal(partsAt(new Date(candidate),timeZone),wanted))matches.push(candidate);
 }
 const unique=[...new Set(matches)];
 if(unique.length===0)throw new Error("Local time does not exist in church timezone");
 if(unique.length>1)throw new Error("Local time is ambiguous in church timezone");
 return new Date(unique[0]).toISOString();
}
