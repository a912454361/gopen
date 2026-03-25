#!/bin/bash
# ====================================================================
# 安全校验脚本 - 上线前校验哈希 + 备份 + 只读 + 加密
# ====================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SERVER_DIR="$PROJECT_ROOT/server"
CLIENT_DIR="$PROJECT_ROOT/client"
SECURITY_DIR="$PROJECT_ROOT/.security"
BACKUP_DIR="$SECURITY_DIR/backups"
HASH_FILE="$SECURITY_DIR/file-hashes.json"
MANIFEST_FILE="$SECURITY_DIR/manifest.json"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   安全校验脚本 - 上线前准备${NC}"
echo -e "${BLUE}========================================${NC}"

# 创建安全目录
mkdir -p "$SECURITY_DIR"
mkdir -p "$BACKUP_DIR"

# 关键文件列表（需要校验的文件）
CRITICAL_FILES=(
    # 后端核心文件
    "server/src/index.ts"
    "server/src/services/consumption-service.ts"
    "server/src/services/reward-service.ts"
    "server/src/services/model-service.ts"
    "server/src/routes/ai-gateway.ts"
    "server/src/routes/consumption.ts"
    "server/src/routes/rewards.ts"
    "server/src/routes/bill.ts"
    "server/src/routes/payment.ts"
    "server/src/routes/admin.ts"
    "server/src/storage/database/supabase-client.ts"
    "server/src/config/model-providers.ts"
    "server/package.json"
    
    # 后端配置文件
    "server/.env"
    "server/.env.production"
    
    # 前端核心文件
    "client/app/_layout.tsx"
    "client/screens/models/index.tsx"
    "client/screens/consumption/index.tsx"
    "client/screens/rewards/index.tsx"
    "client/screens/wallet/index.tsx"
    "client/screens/payment/index.tsx"
    "client/screens/settings/index.tsx"
    "client/hooks/useTheme.ts"
    "client/constants/theme.ts"
    "client/package.json"
    
    # 数据库脚本
    "server/sql/init.sql"
    "server/sql/seed.sql"
)

# ============================================================
# 1. 生成文件哈希
# ============================================================
generate_hashes() {
    echo -e "\n${YELLOW}[1/4] 生成文件哈希...${NC}"
    
    local file_count=0
    local missing_count=0
    local hash_entries=""
    
    for file in "${CRITICAL_FILES[@]}"; do
        local filepath="$PROJECT_ROOT/$file"
        
        if [[ -f "$filepath" ]]; then
            local hash=$(sha256sum "$filepath" | awk '{print $1}')
            local size=$(stat -c%s "$filepath" 2>/dev/null || stat -f%z "$filepath" 2>/dev/null || echo "0")
            local modified=$(stat -c%Y "$filepath" 2>/dev/null || stat -f%m "$filepath" 2>/dev/null || echo "0")
            
            # 构建 JSON 条目
            if [[ -n "$hash_entries" ]]; then
                hash_entries+=","
            fi
            hash_entries+="\"$file\":{\"hash\":\"$hash\",\"size\":$size,\"modified\":$modified}"
            
            echo -e "  ${GREEN}✓${NC} $file"
            ((file_count++))
        else
            echo -e "  ${RED}✗${NC} $file ${YELLOW}(不存在)${NC}"
            ((missing_count++))
        fi
    done
    
    # 保存哈希文件（纯 bash JSON）
    echo "{$hash_entries}" > "$HASH_FILE"
    
    # 生成清单文件
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local manifest=$(cat <<EOF
{
    "version": "1.0.0",
    "generated_at": "$timestamp",
    "total_files": $file_count,
    "missing_files": $missing_count,
    "security_version": "$(date +%Y%m%d%H%M%S)",
    "checksum_algorithm": "sha256"
}
EOF
)
    echo "$manifest" > "$MANIFEST_FILE"
    
    echo -e "\n${GREEN}已生成 $file_count 个文件的哈希${NC}"
    if [[ $missing_count -gt 0 ]]; then
        echo -e "${YELLOW}警告: $missing_count 个文件不存在${NC}"
    fi
}

# ============================================================
# 2. 备份关键文件
# ============================================================
backup_files() {
    echo -e "\n${YELLOW}[2/4] 备份关键文件...${NC}"
    
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/backup_$backup_timestamp"
    local backup_count=0
    
    mkdir -p "$backup_path"
    
    for file in "${CRITICAL_FILES[@]}"; do
        local filepath="$PROJECT_ROOT/$file"
        
        if [[ -f "$filepath" ]]; then
            local target_dir="$backup_path/$(dirname "$file")"
            mkdir -p "$target_dir"
            cp "$filepath" "$target_dir/$(basename "$file")"
            ((backup_count++))
        fi
    done
    
    # 创建备份清单
    echo "backup_timestamp: $backup_timestamp" > "$backup_path/BACKUP_INFO"
    echo "files_count: $backup_count" >> "$backup_path/BACKUP_INFO"
    echo "source_branch: $(git branch --show-current 2>/dev/null || echo 'unknown')" >> "$backup_path/BACKUP_INFO"
    echo "commit_hash: $(git rev-parse HEAD 2>/dev/null || echo 'unknown')" >> "$backup_path/BACKUP_INFO"
    
    # 压缩备份
    tar -czf "$backup_path.tar.gz" -C "$backup_path" .
    rm -rf "$backup_path"
    
    echo -e "${GREEN}已备份 $backup_count 个文件到: $backup_path.tar.gz${NC}"
    
    # 清理旧备份（保留最近 10 个）
    ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm
    echo -e "${BLUE}已清理旧备份（保留最近 10 个）${NC}"
}

# ============================================================
# 3. 设置文件只读
# ============================================================
set_readonly() {
    echo -e "\n${YELLOW}[3/4] 设置文件只读保护...${NC}"
    
    local readonly_count=0
    
    for file in "${CRITICAL_FILES[@]}"; do
        local filepath="$PROJECT_ROOT/$file"
        
        if [[ -f "$filepath" ]]; then
            chmod 444 "$filepath" 2>/dev/null || true
            ((readonly_count++))
        fi
    done
    
    # 设置安全目录权限
    chmod 700 "$SECURITY_DIR"
    chmod 600 "$HASH_FILE" 2>/dev/null || true
    chmod 600 "$MANIFEST_FILE" 2>/dev/null || true
    
    echo -e "${GREEN}已设置 $readonly_count 个文件为只读${NC}"
    
    # 提示如何解除只读（开发时使用）
    echo -e "\n${BLUE}提示: 开发时解除只读请运行:${NC}"
    echo -e "  chmod 644 server/src/*.ts server/src/**/*.ts"
}

# ============================================================
# 4. 加密敏感配置
# ============================================================
encrypt_configs() {
    echo -e "\n${YELLOW}[4/4] 加密敏感配置...${NC}"
    
    local encrypted_count=0
    local sensitive_files=(
        "server/.env"
        "server/.env.production"
    )
    
    for file in "${sensitive_files[@]}"; do
        local filepath="$PROJECT_ROOT/$file"
        
        if [[ -f "$filepath" ]]; then
            local encrypted_path="$SECURITY_DIR/$(echo "$file" | sed 's/\//_/g').encrypted"
            
            # 使用 AES-256-CBC 加密
            if [[ -n "$SECURITY_KEY" ]]; then
                openssl enc -aes-256-cbc -salt -pbkdf2 -in "$filepath" -out "$encrypted_path" -pass pass:"$SECURITY_KEY" 2>/dev/null
                ((encrypted_count++))
                echo -e "  ${GREEN}✓${NC} $file -> $(basename "$encrypted_path")"
            else
                echo -e "  ${YELLOW}⚠${NC} $file - 未设置 SECURITY_KEY 环境变量，跳过加密"
            fi
        fi
    done
    
    if [[ $encrypted_count -gt 0 ]]; then
        echo -e "${GREEN}已加密 $encrypted_count 个敏感文件${NC}"
        echo -e "${BLUE}注意: 请妥善保管 SECURITY_KEY${NC}"
    fi
}

# ============================================================
# 主执行流程
# ============================================================
main() {
    local action="${1:-all}"
    
    case "$action" in
        "hash"|"hashes")
            generate_hashes
            ;;
        "backup")
            backup_files
            ;;
        "readonly")
            set_readonly
            ;;
        "encrypt")
            encrypt_configs
            ;;
        "all")
            generate_hashes
            backup_files
            set_readonly
            encrypt_configs
            ;;
        *)
            echo "用法: $0 [hash|backup|readonly|encrypt|all]"
            echo "  hash     - 生成文件哈希"
            echo "  backup   - 备份关键文件"
            echo "  readonly - 设置文件只读"
            echo "  encrypt  - 加密敏感配置"
            echo "  all      - 执行所有步骤（默认）"
            exit 1
            ;;
    esac
    
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}   安全校验完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "\n生成的文件:"
    echo -e "  - 哈希文件: $HASH_FILE"
    echo -e "  - 清单文件: $MANIFEST_FILE"
    echo -e "  - 备份目录: $BACKUP_DIR"
}

main "$@"
