# terraform/outputs.tf
output "vpc_id" {
  value = aws_vpc.spg_vpc.id
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.spg_cluster.name
}

output "rds_endpoint" {
  value = aws_db_instance.spg_postgres.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.spg_redis.cache_nodes[0].address
}
