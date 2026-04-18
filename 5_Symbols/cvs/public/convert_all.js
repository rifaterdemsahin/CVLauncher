const fs = require('fs');
const path = require('path');
const { mdToPdf } = require('md-to-pdf');

const directory = '/Users/rifaterdemsahin/projects/CVLauncher/5_Symbols/cvs/public';

(async () => {
    const files = fs.readdirSync(directory)
                    .filter(f => f.startsWith('cv_') && f.endsWith('.md'));
    
    for (const filename of files) {
        const mdPath = path.join(directory, filename);
        const pdfPath = path.join(directory, filename.replace('.md', '.pdf'));
        
        try {
            console.log(`Converting ${filename}...`);
            const pdf = await mdToPdf({ path: mdPath }, { dest: pdfPath });
            if (pdf) {
                fs.writeFileSync(pdfPath, pdf.content);
            }
            console.log(`Generated ${pdfPath}`);
        } catch (error) {
            console.error(`Error converting ${filename}:`, error);
        }
    }
    console.log("Done generating all PDFs!");
})();
