#!/usr/bin/env bash
perl -0777 -pi -e 's#<div class="field">\r?\n\s*<label for="adminEmail">Email</label>\r?\n\s*<input id="adminEmail" type="email" autocomplete="username" required />\r?\n\s*</div>\r?\n##s' index.html
perl -0777 -pi -e 's#<p>Sign in with your Supabase admin account \(email \+ password\) to manage website content\.</p>#<p>Enter the admin password to manage website content securely.</p>#' index.html
perl -0777 -pi -e 's#async function loginAdmin\(event\) \{[\s\S]*?\n[ \t]*\}#      async function loginAdmin(event) {\n        event.preventDefault();\n        const password = document.getElementById(\'adminPassword\').value.trim();\n\n        if (password !== \'Humayun@Admin!2026\') {\n          alert(\'Invalid password.\');\n          return;\n        }\n\n        isAuthenticated = true;\n        currentUser = { email: \'admin@local\' };\n        closeLoginModal();\n        openEditorModal();\n      }#s' index.html
sed -n '732,748p' index.html
echo '---'
sed -n '1220,1238p' index.html
