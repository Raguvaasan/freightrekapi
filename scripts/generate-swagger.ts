import { writeFileSync } from 'fs';
import { swaggerSpec } from '../src/config/swagger';

// Generate swagger.json at build time
const spec = JSON.stringify(swaggerSpec, null, 2);
writeFileSync('./public/swagger.json', spec);
console.log('✅ Swagger spec generated at public/swagger.json');
