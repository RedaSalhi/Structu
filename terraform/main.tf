
# terraform/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "spg_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "spg-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "spg_igw" {
  vpc_id = aws_vpc.spg_vpc.id
  
  tags = {
    Name = "spg-igw"
    Environment = var.environment
  }
}

# Subnets
resource "aws_subnet" "spg_public_subnets" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.spg_vpc.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "spg-public-subnet-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_subnet" "spg_private_subnets" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.spg_vpc.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "spg-private-subnet-${count.index + 1}"
    Environment = var.environment
  }
}

# Route Tables
resource "aws_route_table" "spg_public_rt" {
  vpc_id = aws_vpc.spg_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.spg_igw.id
  }
  
  tags = {
    Name = "spg-public-rt"
    Environment = var.environment
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "spg_cluster" {
  name = "spg-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Environment = var.environment
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "spg_postgres" {
  identifier     = "spg-postgres"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type         = "gp2"
  storage_encrypted    = true
  
  db_name  = "structured_products"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.spg_db_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.spg_db_subnet_group.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = var.environment != "production"
  
  tags = {
    Name = "spg-postgres"
    Environment = var.environment
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "spg_redis_subnet_group" {
  name       = "spg-redis-subnet-group"
  subnet_ids = aws_subnet.spg_private_subnets[*].id
}

resource "aws_elasticache_cluster" "spg_redis" {
  cluster_id           = "spg-redis"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.spg_redis_subnet_group.name
  security_group_ids   = [aws_security_group.spg_redis_sg.id]
  
  tags = {
    Name = "spg-redis"
    Environment = var.environment
  }
}

