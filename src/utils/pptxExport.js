import pptxgen from "pptxgenjs";
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export const exportWorkToPPTX = async (work) => {
    try {
        if (!work || !work._id) throw new Error("Invalid project record.");

        let pres = new pptxgen();
        pres.layout = "LAYOUT_WIDE";

        const beforeItems = (work.before || work.beforeData || []).filter(i => i.workTitle || i.image);
        const afterItems = (work.after || work.afterData || []).filter(i => i.workTitle || i.image);
        const isCompleted = work.status === 'completed';

        // 1. Cover Slide
        let coverSlide = pres.addSlide();
        coverSlide.background = { color: "0EA5E9" };

        coverSlide.addText("EGA ADS", {
            x: '5%', y: '5%', w: '90%', h: 1,
            fontSize: 100, color: "FFFFFF", bold: true, opacity: 10, align: 'left'
        });

        coverSlide.addText("EXECUTIVE SUMMARY", {
            x: 0, y: '35%', w: '100%', h: 1,
            fontSize: 52, color: "FFFFFF", bold: true, align: 'center', margin: 0
        });

        coverSlide.addText("PRECISION ASSET REGISTRY", {
            x: 0, y: '50%', w: '100%', h: 0.5,
            fontSize: 22, color: "FFFFFF", align: 'center', margin: 0
        });

        coverSlide.addText(`TRANSACTION ID: #${work._id.slice(-12).toUpperCase()}`, {
            x: '35%', y: '65%', w: '30%', h: 0.5,
            fontSize: 16, color: "FFFFFF", bold: true, align: 'center',
            fill: { color: "FFFFFF", opacity: 20 },
            shape: pres.ShapeType.rect,
            rounding: true
        });

        coverSlide.addText(`AUDIT DATE: ${new Date(work.createdAt).toLocaleDateString(undefined, { dateStyle: 'full' })}`, {
            x: 0, y: '85%', w: '100%', h: 0.5,
            fontSize: 14, color: "FFFFFF", align: 'center'
        });

        // 2. Richie's Phase Slides
        beforeItems.forEach((item, idx) => {
            let slide = pres.addSlide();

            // Header
            slide.addText(item.workTitle || 'INITIAL ASSET REGISTRATION', {
                x: '5%', y: '5%', w: '60%', h: 0.8,
                fontSize: 28, color: "0F172A", bold: true
            });

            slide.addText(`PHASE: RICHIE'S [PHOTO ${idx + 1}/${beforeItems.length}]`, {
                x: '65%', y: '6%', w: '30%', h: 0.5,
                fontSize: 12, color: "0EA5E9", bold: true, align: 'center',
                fill: { color: "0EA5E9", opacity: 10 },
                line: { color: "0EA5E9", width: 1 }
            });

            // Image
            if (item.image) {
                slide.addImage({
                    path: item.image,
                    x: '5%', y: '18%', w: '55%', h: '70%',
                    rounding: true
                });
            } else {
                slide.addText("NO IMAGE LOGGED", {
                    x: '5%', y: '18%', w: '55%', h: '70%',
                    fontSize: 14, color: "CBD5E1", align: 'center', valign: 'middle',
                    fill: { color: "F8FAFC" }
                });
            }

            // Details Panel
            slide.addText("SITE LEAD PERSONNEL", { x: '63%', y: '20%', w: '32%', h: 0.3, fontSize: 10, color: "64748B", bold: true });
            slide.addText(work.beforeEmployeeId?.name || 'Authorized Submitter', { x: '63%', y: '24%', w: '32%', h: 0.5, fontSize: 18, color: "0F172A", bold: true });

            slide.addText("DIMENSIONS", { x: '63%', y: '35%', w: '15%', h: 0.3, fontSize: 10, color: "64748B", bold: true });
            slide.addText(`${item.heightFeet}' \u00D7 ${item.widthFeet}'`, { x: '63%', y: '39%', w: '15%', h: 0.5, fontSize: 16, color: "0F172A", bold: true });

            slide.addText("TOTAL OFFSET", { x: '80%', y: '35%', w: '15%', h: 0.3, fontSize: 10, color: "64748B", bold: true });
            slide.addText(`${item.totalSqFt || (item.heightFeet * item.widthFeet)} SQFT`, { x: '80%', y: '39%', w: '15%', h: 0.5, fontSize: 16, color: "0F172A", bold: true });

            slide.addText("GEOGRAPHIC COORDINATES / SITE", { x: '63%', y: '55%', w: '32%', h: 0.3, fontSize: 10, color: "94A3B8", bold: true });
            slide.addText(item.location || 'Registry Logged at Default Site Office', {
                x: '63%', y: '59%', w: '32%', h: 0.8,
                fontSize: 12, color: "FFFFFF",
                fill: { color: "0F172A" },
                rounding: true,
                padding: 10
            });

            // Footer
            slide.addText("EGA ADS | PROFESSIONAL REGISTRY SYSTEM", { x: '5%', y: '93%', w: '45%', h: 0.3, fontSize: 10, color: "94A3B8", bold: true });
            slide.addText(`SECURE RECORD [PX-0${idx + 1}-RICHIE'S]`, { x: '65%', y: '93%', w: '30%', h: 0.3, fontSize: 10, color: "94A3B8", bold: true, align: 'right' });
        });

        // 3. Insulation Phase Slides
        if (isCompleted && afterItems.length > 0) {
            afterItems.forEach((item, idx) => {
                let slide = pres.addSlide();

                // Header
                slide.addText(item.workTitle || 'COMPLETED PROJECT ASSIGNMENT', {
                    x: '5%', y: '5%', w: '60%', h: 0.8,
                    fontSize: 28, color: "0F172A", bold: true
                });

                slide.addText(`PHASE: INSULATION [PHOTO ${idx + 1}/${afterItems.length}]`, {
                    x: '65%', y: '6%', w: '30%', h: 0.5,
                    fontSize: 12, color: "22C55E", bold: true, align: 'center',
                    fill: { color: "22C55E", opacity: 10 },
                    line: { color: "22C55E", width: 1 }
                });

                // Image
                if (item.image) {
                    slide.addImage({
                        path: item.image,
                        x: '5%', y: '18%', w: '55%', h: '70%',
                        rounding: true
                    });
                } else {
                    slide.addText("COMPLETION PHOTO MISSING", {
                        x: '5%', y: '18%', w: '55%', h: '70%',
                        fontSize: 14, color: "CBD5E1", align: 'center', valign: 'middle',
                        fill: { color: "F8FAFC" }
                    });
                }

                // Details Panel
                slide.addText("VERIFICATION PERSONNEL", { x: '63%', y: '20%', w: '32%', h: 0.3, fontSize: 10, color: "64748B", bold: true });
                slide.addText(work.afterEmployeeId?.name || work.beforeEmployeeId?.name || 'Verified Staff', { x: '63%', y: '24%', w: '32%', h: 0.5, fontSize: 18, color: "0F172A", bold: true });

                slide.addText("FINAL CERTIFIED AREA", { x: '63%', y: '35%', w: '32%', h: 0.3, fontSize: 10, color: "64748B", bold: true });
                slide.addText(`${item.totalSqFt || (item.heightFeet * item.widthFeet)} SQFT`, { x: '63%', y: '39%', w: '32%', h: 0.5, fontSize: 18, color: "0F172A", bold: true });

                slide.addText("VERIFIED SITE LOCATION", { x: '63%', y: '55%', w: '32%', h: 0.3, fontSize: 10, color: "F0FDF4", bold: true });
                slide.addText(item.location || 'Registry Confirmed at Site', {
                    x: '63%', y: '59%', w: '32%', h: 0.8,
                    fontSize: 12, color: "FFFFFF",
                    fill: { color: "22C55E" },
                    rounding: true,
                    padding: 10
                });

                slide.addText(`COMPLETION VERIFIED: ${new Date().toLocaleDateString()}`, {
                    x: '63%', y: '75%', w: '32%', h: 0.5,
                    fontSize: 10, color: "166534",
                    fill: { color: "F0FDF4" },
                    rounding: true,
                    padding: 5
                });

                // Footer
                slide.addText("EGA ADS | PROFESSIONAL REGISTRY SYSTEM", { x: '5%', y: '93%', w: '45%', h: 0.3, fontSize: 10, color: "94A3B8", bold: true });
                slide.addText(`SECURE RECORD [PX-0${idx + 1}-INSULATION]`, { x: '65%', y: '93%', w: '30%', h: 0.3, fontSize: 10, color: "94A3B8", bold: true, align: 'right' });
            });
        }

        // 4. Closing Slide
        let closingSlide = pres.addSlide();
        closingSlide.background = { color: "0F172A" };

        closingSlide.addText("ARCHIVE", {
            x: 0, y: '35%', w: '100%', h: 1,
            fontSize: 36, color: "FFFFFF", align: 'center', bold: false, letterSpacing: 8
        });

        closingSlide.addShape(pres.ShapeType.rect, { x: '45%', y: '48%', w: '10%', h: 0.02, fill: { color: "0EA5E9" } });

        closingSlide.addText("This presentation serves as the official legal registry of the EGA ADS project. All data, including dimensions, images, and geographic locations, have been hashed and secured within the administrative database.", {
            x: '25%', y: '55%', w: '50%', h: 1,
            fontSize: 14, color: "FFFFFF", opacity: 60, align: 'center'
        });

        closingSlide.addText(`END OF DOCUMENT - REF: #${work._id.slice(-8).toUpperCase()}`, {
            x: '35%', y: '75%', w: '30%', h: 0.5,
            fontSize: 12, color: "FFFFFF", bold: true, align: 'center',
            fill: { color: "1E293B" },
            rounding: true
        });

        // 5. Generate and Share
        const base64 = await pres.write("base64");
        const filename = `EGA_ADS_${work._id.slice(-8).toUpperCase()}.pptx`;
        const filepath = FileSystem.cacheDirectory + filename;

        await FileSystem.writeAsStringAsync(filepath, base64, {
            encoding: 'base64',
        });

        await Sharing.shareAsync(filepath, {
            mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            dialogTitle: `EGA ADS PPTX - ${work._id.slice(-8).toUpperCase()}`,
        });

    } catch (error) {
        console.error('PPTX Presentation Export Error:', error);
        throw error;
    }
};
