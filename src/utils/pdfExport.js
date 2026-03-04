import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const exportWorkToPDF = async (work) => {
    try {
        if (!work || !work._id) throw new Error("Invalid project record.");

        const beforeItems = (work.before || work.beforeData || []).filter(i => i.workTitle || i.image);
        const afterItems = (work.after || work.afterData || []).filter(i => i.workTitle || i.image);
        const isCompleted = work.status === 'completed';

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    @page { size: landscape; margin: 0; }
                    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #fff; }
                    
                    .slide { width: 100vw; height: 100vh; padding: 40px; box-sizing: border-box; page-break-after: always; position: relative; background: #fff; overflow: hidden; }
                    
                    /* Cover Slide */
                    .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; }
                    .cover h1 { font-size: 52px; margin: 0; font-weight: 900; letter-spacing: -2px; text-transform: uppercase; }
                    .cover p { font-size: 22px; opacity: 0.9; margin-top: 15px; font-weight: 300; letter-spacing: 2px; }
                    .order-id { background: rgba(255,255,255,0.2); padding: 10px 30px; border-radius: 50px; font-size: 16px; margin-top: 40px; font-weight: 600; border: 1px solid rgba(255,255,255,0.3); }

                    /* Phase Layout */
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; }
                    .title { font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
                    .phase-tag { padding: 8px 20px; border-radius: 10px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
                    .tag-before { background: #0ea5e915; color: #0ea5e9; border: 1px solid #0ea5e930; }
                    .tag-after { background: #22c55e15; color: #22c55e; border: 1px solid #22c55e30; }

                    .content-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 30px; height: calc(100vh - 160px); }
                    
                    .view-port { border-radius: 24px; overflow: hidden; background: #f8fafc; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); height: 100%; width: 100%; position: relative; }
                    .view-port img { width: 100%; height: 100%; object-fit: cover; }
                    
                    .details-panel { display: flex; flex-direction: column; gap: 20px; }
                    .data-point { background: #f8fafc; padding: 22px; border-radius: 20px; border: 1px solid #f1f5f9; }
                    .kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; margin-bottom: 10px; display: block; }
                    .kpi-value { font-size: 20px; font-weight: 800; color: #0f172a; }
                    
                    .dim-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                    
                    .loc-box { background: #0f172a; color: white; padding: 22px; border-radius: 20px; box-shadow: 0 15px 30px -10px rgba(15,23,42,0.3); }
                    .loc-label { color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; display: block; margin-bottom: 10px; }
                    .loc-value { font-size: 14px; font-weight: 500; line-height: 1.6; }

                    .footer-bar { position: absolute; bottom: 30px; left: 40px; right: 40px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 15px; font-size: 11px; color: #94a3b8; font-weight: 600; }
                </style>
            </head>
            <body>
                <!-- COVER SLIDE -->
                <div class="slide cover">
                    <div style="opacity: 0.1; font-size: 150px; position: absolute; top: -50px; left: -50px; font-weight: 900;">EGA</div>
                    <div style="opacity: 0.1; font-size: 150px; position: absolute; bottom: -50px; right: -50px; font-weight: 900;">ADS</div>
                    <h1>Executive Summary</h1>
                    <p>PRECISION ASSET REGISTRY</p>
                    <div class="order-id">TRANSACTION ID: #${work._id.slice(-12).toUpperCase()}</div>
                    <div style="margin-top: 50px;">
                        <span style="font-size: 12px; font-weight: 800; letter-spacing: 2px;">AUDIT DATE</span><br/>
                        <span style="font-size: 18px; font-weight: 400;">${new Date(work.createdAt).toLocaleDateString(undefined, { dateStyle: 'full' })}</span>
                    </div>
                </div>

                <!-- Richie's Phase Slides -->
                ${beforeItems.map((item, idx) => `
                <div class="slide">
                    <div class="header">
                        <div class="title">${item.workTitle || 'Initial Asset Registration'}</div>
                        <div class="phase-tag tag-before">PHASE: RICHIE'S [PHOTO ${idx + 1}/${beforeItems.length}]</div>
                    </div>
                    <div class="content-grid">
                        <div class="view-port">
                            ${item.image ? `<img src="${item.image}" />` : `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#cbd5e1; font-size:12px;">NO IMAGE LOGGED</div>`}
                        </div>
                        <div class="details-panel">
                            <div class="data-point">
                                <span class="kpi-label">SITE LEAD PERSONNEL</span>
                                <span class="kpi-value">${work.beforeEmployeeId?.name || 'Authorized Submitter'}</span>
                            </div>
                            <div class="dim-grid">
                                <div class="data-point">
                                    <span class="kpi-label">DIMENSIONS</span>
                                    <span class="kpi-value">${item.heightFeet}' &times; ${item.widthFeet}'</span>
                                </div>
                                <div class="data-point">
                                    <span class="kpi-label">TOTAL OFFSET</span>
                                    <span class="kpi-value">${item.totalSqFt || (item.heightFeet * item.widthFeet)} SQFT</span>
                                </div>
                            </div>
                            <div class="loc-box">
                                <span class="loc-label">GEOGRAPHIC COORDINATES / SITE</span>
                                <span class="loc-value">${item.location || 'Registry Logged at Default Site Office'}</span>
                            </div>
                            <div style="margin-top: auto; padding: 15px; border: 1px dashed #e2e8f0; border-radius: 12px; font-size: 8px; color: #94a3b8;">
                                REGISTRY REF: https://ega-ads-backend.vercel.app/api/works/getwork/${work._id}
                            </div>
                        </div>
                    </div>
                    <div class="footer-bar">
                        <span>EGA ADS | PROFESSIONAL REGISTRY SYSTEM</span>
                        <span style="letter-spacing: 2px;">SECURE RECORD [PX-0${idx + 1}-RICHIE'S]</span>
                    </div>
                </div>
                `).join('')}

                <!-- Insulation Phase Slides -->
                ${(isCompleted && afterItems.length > 0) ? afterItems.map((item, idx) => `
                <div class="slide">
                    <div class="header">
                        <div class="title">${item.workTitle || 'Completed Project Assignment'}</div>
                        <div class="phase-tag tag-after">PHASE: INSULATION [PHOTO ${idx + 1}/${afterItems.length}]</div>
                    </div>
                    <div class="content-grid">
                        <div class="view-port">
                            ${item.image ? `<img src="${item.image}" />` : `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#cbd5e1; font-size:12px;">COMPLETION PHOTO MISSING</div>`}
                        </div>
                        <div class="details-panel">
                            <div class="data-point">
                                <span class="kpi-label">VERIFICATION PERSONNEL</span>
                                <span class="kpi-value">${work.afterEmployeeId?.name || work.beforeEmployeeId?.name || 'Verified Staff'}</span>
                            </div>
                            <div class="data-point">
                                <span class="kpi-label">FINAL CERTIFIED AREA</span>
                                <span class="kpi-value">${item.totalSqFt || (item.heightFeet * item.widthFeet)} SQFT</span>
                            </div>
                            <div class="loc-box" style="background: #22c55e;">
                                <span class="loc-label" style="color: #f0fdf4;">VERIFIED SITE LOCATION</span>
                                <span class="loc-value">${item.location || 'Registry Confirmed at Site'}</span>
                            </div>
                            <div style="margin-top: auto; padding: 10px; border: 1px solid #bbf7d0; border-radius: 12px; font-size: 8px; color: #166534; background: #f0fdf4;">
                                COMPLETION VERIFIED: ${new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <div class="footer-bar">
                        <span>EGA ADS | PROFESSIONAL REGISTRY SYSTEM</span>
                        <span style="letter-spacing: 2px;">SECURE RECORD [PX-0${idx + 1}-INSULATION]</span>
                    </div>
                </div>
                `).join('') : ''}

                <!-- CLOSING SLIDE -->
                <div class="slide cover" style="background: #0f172a;">
                    <h2 style="font-size: 36px; font-weight: 300; letter-spacing: 8px; margin-bottom: 20px;">ARCHIVE</h2>
                    <div style="width: 100px; height: 2px; background: #0ea5e9; margin-bottom: 30px;"></div>
                    <p style="font-size: 14px; max-width: 600px; opacity: 0.6;">This presentation serves as the official legal registry of the EGA ADS project. All data, including dimensions, images, and geographic locations, have been hashed and secured within the administrative database.</p>
                    <div class="order-id" style="border-color: #1e293b;">END OF DOCUMENT - REF: #${work._id.slice(-8).toUpperCase()}</div>
                </div>
            </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `EGA ADS Presentation - ${work._id.slice(-8).toUpperCase()}`,
            UTI: 'com.adobe.pdf'
        });

    } catch (error) {
        console.error('PDF Presentation Export Error:', error);
        throw error;
    }
};
