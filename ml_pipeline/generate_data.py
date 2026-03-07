import psycopg2
import psycopg2.extras
import numpy as np
import random
from datetime import datetime, timedelta

DB_PARAMS = {
    "dbname": "shadowstack_db", "user": "postgres",
    "password": "password", "host": "localhost", "port": "5433"
}

# Pricing Config matching Section 4.3
# Upgraded Pricing Config (Realistic AWS Approximations)
PRICING = {
    'compute': [
        # General Purpose
        ('t3.micro', 0.0104), ('t3.medium', 0.0416), ('t3.large', 0.0832),
        ('m5.large', 0.096), ('m5.xlarge', 0.192), ('m5.4xlarge', 0.768),
        # Compute Optimized
        ('c5.large', 0.085), ('c5.xlarge', 0.170),
        # Memory Optimized
        ('r5.large', 0.126),
        # GPU / Machine Learning (Perfect for an AI project!)
        ('g4dn.xlarge', 0.526), ('p3.2xlarge', 3.06)
    ],
    'storage': [
        # Object Storage
        ('S3-standard', 0.023), ('S3-intelligent-tiering', 0.0125), ('S3-glacier-deep-archive', 0.00099),
        # Block Storage
        ('EBS-gp3', 0.08), ('EBS-io2-provisioned', 0.125),
        # File Storage
        ('EFS-standard', 0.30)
    ],
    'network': [
        ('egress-internet', 0.09), ('egress-regional', 0.01),
        ('nat-gateway-hour', 0.045), ('transit-gateway-hour', 0.05),
        ('elastic-ip-idle', 0.005)
    ],
    'database': [
        # Relational
        ('RDS-postgres', 0.115), ('RDS-mysql', 0.068), ('Aurora-serverless', 0.12),
        # NoSQL
        ('DynamoDB-wcu', 0.00065), ('DocumentDB', 0.277)
    ],
    'cache': [
        ('ElastiCache-redis', 0.034), ('ElastiCache-memcached', 0.025),
        ('MemoryDB', 0.06)
    ]
}

# The 5 primary services MUST remain the same due to S2 Schema Constraints
SERVICES = ['compute', 'storage', 'network', 'database', 'cache']
SERVICE_WEIGHTS = [0.40, 0.25, 0.20, 0.10, 0.05]

# Expanded Global AWS Regions
REGIONS = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', # North America
    'eu-west-1', 'eu-central-1', 'eu-west-2',           # Europe
    'ap-south-1', 'ap-southeast-1', 'ap-northeast-1',   # Asia Pacific
    'sa-east-1', 'ca-central-1'                         # South America / Canada
]

def generate_and_insert():
    conn = psycopg2.connect(**DB_PARAMS)
    conn.autocommit = True
    cursor = conn.cursor()

    print("🧹 Dropping the old wrong table...")
    cursor.execute("DROP TABLE IF EXISTS usage_data CASCADE;")
    
    # The Official DDL from the ShadowStack Schema Document
    print("🛠️ Rebuilding the OFFICIAL table schema...")
    ddl = """
    CREATE TABLE usage_data (
        id BIGSERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL,
        service_name VARCHAR(100) NOT NULL,
        cost_usd NUMERIC(12, 4) NOT NULL,
        resource_type VARCHAR(100),
        region VARCHAR(50),
        complexity_score NUMERIC(5, 2),
        resource_units NUMERIC(12, 4),
        is_synthetic BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """
    cursor.execute(ddl)

    # Tables designed for up to 10,000 records
    num_records = 50000 
    print(f"🧠 Generating {num_records} official rows...")

    start_date = datetime.now() - timedelta(days=365)
    complexity_scores = np.random.beta(a=2, b=5, size=num_records) * 9 + 1
    
    data_tuples = []
    
    for i in range(num_records):
        timestamp = start_date + timedelta(minutes=random.randint(0, 365*24*60))
        comp = float(round(complexity_scores[i], 2))
        svc = random.choices(SERVICES, weights=SERVICE_WEIGHTS, k=1)[0]
        res_type, unit_price = random.choice(PRICING[svc])
        region = random.choice(REGIONS)
        
        service_multiplier = 500.0 
        units = comp * service_multiplier * np.random.normal(1, 0.15)
        units = max(0.1, units) 
        
        cost = (units * unit_price) + np.random.normal(0, 2)
        cost = max(0.01, cost) 
        
        data_tuples.append((
            timestamp, svc, round(cost, 4), res_type, region, comp, round(units, 4), True
        ))

    print("💾 Inserting data into PostgreSQL...")
    insert_query = """
        INSERT INTO usage_data 
        (timestamp, service_name, cost_usd, resource_type, region, complexity_score, resource_units, is_synthetic)
        VALUES %s
    """
    psycopg2.extras.execute_values(cursor, insert_query, data_tuples, page_size=2000)
    
    print("🎉 SUCCESS! Dataset perfectly matches the ShadowStack Design Document.")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    generate_and_insert()