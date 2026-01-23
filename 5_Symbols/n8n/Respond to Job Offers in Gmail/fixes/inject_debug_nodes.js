require('dotenv').config({ path: '../../.env' });
const axios = require('axios');
const crypto = require('crypto');

let protocol = process.env.N8N_PROTOCOL || 'https';
let host = process.env.N8N_HOST || 'n8n.rifaterdemsahin.com';
const apiKey = process.env.N8N_API_KEY;
const targetWorkflowId = process.env.N8N_WORKFLOW_ID_CVD || 'CVD1ecv1GNe9uF4a';

host = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
const baseUrl = `${protocol}://${host}/api/v1`;

async function injectDebugNodes() {
    try {
        console.log('Fetching workflow...');
        const wfResponse = await axios.get(`${baseUrl}/workflows/${targetWorkflowId}`, {
            headers: { 'X-N8N-API-KEY': apiKey }
        });
        const workflow = wfResponse.data;

        // User wants "Do Nothing" (NoOp) nodes with console logging to identify blockers.
        // In n8n, "Code" nodes are best for this as they can log to the browser console (execution log).
        
        const createDebugNode = (name, label, pos) => ({
            "parameters": {
                "jsCode": `console.log('🔹 DEBUG: Reached ${label}');\nreturn items;`
            },
            "name": name,
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": pos,
            "id": crypto.randomUUID()
        });

        // We will insert debug nodes at critical junctions:
        // 1. After Trigger/Rate Limit (Start of logic)
        // 2. After Keywords (Start of Check)
        // 3. After Blacklist (Check result)
        // 4. After Is Blacklisted? (Branch split)
        
        let modified = false;

        // Junction 1: After "Limit Rate" -> Before "Wait"
        // Current: Limit Rate -> Rate Limit Delay
        if (!workflow.nodes.find(n => n.name === 'Debug: Start')) {
            console.log('Injecting "Debug: Start"...');
            const debugNode = createDebugNode('Debug: Start', 'Start of Loop', [-350, -180]); // Between Split and Wait
            workflow.nodes.push(debugNode);
            
            // Re-wire: Limit Rate -> Debug: Start -> Rate Limit Delay
            if (workflow.connections['Limit Rate']) {
                const limitOut = workflow.connections['Limit Rate'].main[0];
                // Point Limit Rate to Debug
                workflow.connections['Limit Rate'].main[0] = [{ node: 'Debug: Start', type: 'main', index: 0 }];
                
                // Point Debug to whatever Limit Rate was pointing to (Wait Node)
                workflow.connections['Debug: Start'] = {
                    main: [[ { node: 'Rate Limit Delay', type: 'main', index: 0 } ]]
                };
            }
            modified = true;
        }

        // Junction 2: After "Check for Recruiter Keywords" -> Before "Check Blacklist"
        // Current: Keywords -> Check Blacklist (Index 0) AND Restore Context (Index 1)
        // This is a split output. Inserting a node here is tricky because we have 2 wires.
        // If we insert "Debug: Keywords Passed", we must duplicate the fan-out.
        
        /* 
           Current:
           Keywords --(0)--> Check Blacklist
                    --(1)--> Restore Context (in previous logic? No, check refactor script)
           
           Refactor script logic (step 438):
           Keywords -> Check Blacklist
           Keywords -> Restore Context (Input 2, index 1 of Restore Context)
           
           Wait, "Check for Recruiter Keywords" output 0 goes to TWO places:
           1. Check Blacklist
           2. Restore Context (Input 2)
           
           So we can insert "Debug: Keywords" right after Keywords, before the fan-out.
        */
       
        if (!workflow.nodes.find(n => n.name === 'Debug: Keywords Passed')) {
            console.log('Injecting "Debug: Keywords Passed"...');
            const debugNode = createDebugNode('Debug: Keywords Passed', 'Keywords Matched', [-150, -350]); 
            workflow.nodes.push(debugNode);
            
            // Get original targets of Keywords
            const keywordTargets = workflow.connections['Check for Recruiter Keywords'].main[0];
            
            // Point Keywords -> Debug
            workflow.connections['Check for Recruiter Keywords'].main[0] = [{ node: 'Debug: Keywords Passed', type: 'main', index: 0 }];
            
            // Point Debug -> Original Targets (Fan-out)
            workflow.connections['Debug: Keywords Passed'] = {
                main: [ keywordTargets ]
            };
            modified = true;
        }

        // Junction 3: After "Restore Context" -> Before "Is Blacklisted?"
        if (!workflow.nodes.find(n => n.name === 'Debug: Context Restored')) {
            console.log('Injecting "Debug: Context Restored"...');
            const debugNode = createDebugNode('Debug: Context Restored', 'Data Merged', [170, -350]);
            workflow.nodes.push(debugNode);
            
            // Re-wire Restore Context -> Debug -> Is Blacklisted?
            const restoreOut = workflow.connections['Restore Context'].main[0]; // Should contain Is Blacklisted?
            
            workflow.connections['Restore Context'].main[0] = [{ node: 'Debug: Context Restored', type: 'main', index: 0 }];
            
            workflow.connections['Debug: Context Restored'] = {
                main: [ restoreOut ]
            };
            modified = true;
        }

        if (modified) {
            const payload = {
                nodes: workflow.nodes,
                connections: workflow.connections,
                settings: workflow.settings,
                name: workflow.name
            };

            await axios.put(`${baseUrl}/workflows/${targetWorkflowId}`, payload, {
                headers: { 'X-N8N-API-KEY': apiKey }
            });

            console.log('✅ Success! Injected 3 Debug Nodes with console logs.');
            console.log('   - Debug: Start');
            console.log('   - Debug: Keywords Passed');
            console.log('   - Debug: Context Restored');
        } else {
            console.log('Debug nodes already exist.');
        }

    } catch (error) {
        console.error('Update failed:', error.message);
    }
}

injectDebugNodes();
