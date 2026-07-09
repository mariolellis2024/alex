import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  
  const link = await prisma.trackingLink.findUnique({
    where: { code: codigo },
  });

  if (!link) {
    return new NextResponse("Página não encontrada", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const fbclid = searchParams.get("fbclid");
  const utmSource = searchParams.get("utm_source");
  const utmMedium = searchParams.get("utm_medium");
  const utmCampaign = searchParams.get("utm_campaign");

  const cookieStore = await cookies();
  const fbp = cookieStore.get("_fbp")?.value;
  const fbc = fbclid ? `fb.1.${Date.now()}.${fbclid}` : cookieStore.get("_fbc")?.value;

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0] : request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");

  // Record the click
  const click = await prisma.click.create({
    data: {
      trackingLinkId: link.id,
      fbclid,
      fbp,
      fbc: fbc || null,
      utmSource,
      utmMedium,
      utmCampaign,
      ip: ip || null,
      userAgent: userAgent || null,
    },
  });

  // Determine WhatsApp Number
  let waNumber = link.destinationNumber;

  if (!waNumber) {
    // Retrieve an active connection
    const connections = await prisma.connection.findMany({
      where: { status: "CONNECTED", number: { not: null } },
      orderBy: { createdAt: "asc" }
    });
    
    if (connections.length > 0) {
      // Pick a random connection to balance the load (Round robin should ideally be stateful)
      waNumber = connections[Math.floor(Math.random() * connections.length)].number;
    }
  }

  if (!waNumber) {
    return new NextResponse("Nenhum atendente disponível no momento. Tente novamente mais tarde.", { status: 503 });
  }

  // Sanitize the number
  const cleanNumber = waNumber.replace(/\D/g, "");

  // Create the tracking message
  // Using a short code reference to map the lead back to this click
  const shortId = click.id.slice(-8); // A smaller chunk of the CUID to make it look nicer
  const text = `${link.initialMessage}\n\n(Ref: ${shortId})`;
  const encodedText = encodeURIComponent(text);

  const redirectUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;

  const response = NextResponse.redirect(redirectUrl);
  
  if (fbc) {
    response.cookies.set("_fbc", fbc, { maxAge: 60 * 60 * 24 * 90 }); // 90 dias
  }

  return response;
}
