import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const regionDays:Record<string,number>={SP:5,RJ:6,MG:6,ES:7,PR:7,SC:7,RS:8,DF:7,GO:7,MS:8,MT:9,BA:9,SE:9,AL:10,PE:10,PB:11,RN:11,CE:11,PI:12,MA:12,PA:13,TO:11,RO:14,AC:15,AM:16,RR:16,AP:16};
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
const makeCode=()=>`KIT-${crypto.randomUUID().replaceAll("-","").slice(0,8).toUpperCase()}`;

function database(){
  if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL não configurada");
  return neon(process.env.DATABASE_URL);
}

export async function POST(request:Request){
  try{
    const body=await request.json() as Record<string,unknown>;
    const required=["name","email","phone","cep","uf","city","district","address"];
    if(required.some(key=>typeof body[key]!=="string"||!String(body[key]).trim()))return response({error:"Dados incompletos"},400);
    if(!Array.isArray(body.items)||body.items.length===0||typeof body.total!=="number"||body.total<=0)return response({error:"Carrinho inválido"},400);
    const sql=database(),code=makeCode();
    await sql`INSERT INTO orders (code,customer_name,email,phone,cep,uf,city,district,address,items_json,total,status) VALUES (${code},${String(body.name).trim()},${String(body.email).trim()},${String(body.phone).trim()},${String(body.cep).trim()},${String(body.uf).trim().toUpperCase()},${String(body.city).trim()},${String(body.district).trim()},${String(body.address).trim()},${JSON.stringify(body.items)}::jsonb,${body.total},'confirmed')`;
    return response({code},201);
  }catch(error){console.error("order_create_failed",error);return response({error:"Pedido indisponível"},503)}
}

export async function GET(request:Request){
  const code=new URL(request.url).searchParams.get("code")?.trim().toUpperCase();
  if(!code||!/^KIT-[A-Z0-9]{8}$/.test(code))return response({error:"Código inválido"},400);
  try{
    const sql=database();
    const rows=await sql`SELECT code,uf,city,status,created_at FROM orders WHERE code=${code} LIMIT 1`;
    const order=rows[0] as {code:string;uf:string;city:string;status:string;created_at:string}|undefined;
    if(!order)return response({error:"Pedido não encontrado"},404);
    const createdAt=new Date(order.created_at).getTime(),elapsedHours=Math.max(0,(Date.now()-createdAt)/3_600_000);
    const currentStep=elapsedHours<24?0:elapsedHours<72?1:elapsedHours<120?2:3;
    const estimateDate=new Date(createdAt+(regionDays[order.uf]??10)*86_400_000);
    const estimate=estimateDate.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"});
    const steps=[{label:"Pedido confirmado",detail:"Recebemos seu pedido e os dados de entrega."},{label:"Preparando o manto",detail:"Conferência de tamanho e acabamento."},{label:"Em trânsito",detail:`A caminho do centro de distribuição de ${order.uf}.`},{label:"Saiu para entrega",detail:`Entrega final em ${order.city}.`}];
    return response({code:order.code,city:order.city,uf:order.uf,estimate,currentStep,progress:[18,45,72,100][currentStep],steps});
  }catch(error){console.error("order_track_failed",error);return response({error:"Rastreio indisponível"},503)}
}
