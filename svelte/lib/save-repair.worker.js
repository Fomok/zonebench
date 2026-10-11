import {repairFiles} from './save-repair.mjs';
self.onmessage=async({data})=>{
 try{const result=await repairFiles(data.saves,data.addons,data.name);self.postMessage({ok:true,...result},result.bytes?[result.bytes.buffer]:[]);}
 catch(error){self.postMessage({ok:false,error:error instanceof Error?error.message:'The save could not be repaired.'});}
};
