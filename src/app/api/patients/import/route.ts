import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patients } = await req.json();

    if (!Array.isArray(patients)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const results = await Promise.all(
      patients.map(async (patient) => {
        try {
          // First create the lead
          const lead = await prisma.lead.create({
            data: {
              name: patient.name,
              phone: patient.phone,
              email: patient.email || null,
              status: patient.lead?.status || "novo",
              medicalNotes: patient.lead?.medicalNotes || null,
              userId: session.user.id
            }
          });

          // Then create the patient connected to the lead
          const newPatient = await prisma.patient.create({
            data: {
              name: patient.name,
              email: patient.email,
              phone: patient.phone,
              userId: session.user.id,
              leadId: lead.id,
              hasPortalAccess: false
            }
          });

          return { success: true, id: newPatient.id };
        } catch (error) {
          console.error('Error creating patient:', error);
          return { success: false, error };
        }
      })
    );

    const successfulImports = results.filter(result => result.success).length;

    return NextResponse.json({
      imported: successfulImports,
      total: patients.length,
      failed: patients.length - successfulImports
    });
  } catch (error) {
    console.error('Error in import endpoint:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 