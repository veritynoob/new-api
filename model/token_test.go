package model

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ============================================================================
// Step 1: Token struct field tests (no DB required)
// ============================================================================

func TestTokenStructHasNewFields(t *testing.T) {
	token := Token{
		System:        "api-gateway",
		Team:          "backend",
		ReviewComment: "Approved for production use",
	}
	assert.Equal(t, "api-gateway", token.System)
	assert.Equal(t, "backend", token.Team)
	assert.Equal(t, "Approved for production use", token.ReviewComment)

	// Verify zero values
	zeroToken := Token{}
	assert.Empty(t, zeroToken.System)
	assert.Empty(t, zeroToken.Team)
	assert.Empty(t, zeroToken.ReviewComment)
}

// ============================================================================
// Step 2: ValidateUserToken rejects pending/rejected (DB tests)
// ============================================================================

func TestValidateUserToken_RejectsPending(t *testing.T) {
	truncateTables(t)

	token := &Token{
		UserId:      1,
		Key:         "sk-test-pending-0000000000000000000000000000",
		Status:      common.TokenStatusPending,
		Name:        "Test Pending Token",
		CreatedTime: time.Now().Unix(),
		ExpiredTime: -1,
	}
	require.NoError(t, DB.Create(token).Error)

	result, err := ValidateUserToken("sk-test-pending-0000000000000000000000000000")
	assert.NotNil(t, result)
	assert.ErrorIs(t, err, ErrTokenInvalid)
}

func TestValidateUserToken_RejectsRejected(t *testing.T) {
	truncateTables(t)

	token := &Token{
		UserId:      1,
		Key:         "sk-test-rejected-000000000000000000000000000",
		Status:      common.TokenStatusRejected,
		Name:        "Test Rejected Token",
		CreatedTime: time.Now().Unix(),
		ExpiredTime: -1,
	}
	require.NoError(t, DB.Create(token).Error)

	result, err := ValidateUserToken("sk-test-rejected-000000000000000000000000000")
	assert.NotNil(t, result)
	assert.ErrorIs(t, err, ErrTokenInvalid)
}

func TestValidateUserToken_AcceptsEnabled(t *testing.T) {
	truncateTables(t)

	token := &Token{
		UserId:         1,
		Key:            "sk-test-enabled-00000000000000000000000000000",
		Status:         common.TokenStatusEnabled,
		Name:           "Test Enabled Token",
		CreatedTime:    time.Now().Unix(),
		ExpiredTime:    -1,
		UnlimitedQuota: true,
	}
	require.NoError(t, DB.Create(token).Error)

	result, err := ValidateUserToken("sk-test-enabled-00000000000000000000000000000")
	assert.Nil(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "sk-test-enabled-00000000000000000000000000000", result.Key)
}

func TestValidateUserToken_RejectsDisabled(t *testing.T) {
	truncateTables(t)

	token := &Token{
		UserId:      1,
		Key:         "sk-test-disabled-0000000000000000000000000000",
		Status:      common.TokenStatusDisabled,
		Name:        "Test Disabled Token",
		CreatedTime: time.Now().Unix(),
		ExpiredTime: -1,
	}
	require.NoError(t, DB.Create(token).Error)

	result, err := ValidateUserToken("sk-test-disabled-0000000000000000000000000000")
	assert.NotNil(t, result)
	assert.ErrorIs(t, err, ErrTokenInvalid)
}

func TestValidateUserToken_EmptyKey(t *testing.T) {
	result, err := ValidateUserToken("")
	assert.Nil(t, result)
	assert.ErrorIs(t, err, ErrTokenNotProvided)
}

// ============================================================================
// Step 3: Update() Select list includes new fields (DB tests)
// ============================================================================

func TestTokenUpdate_IncludesNewFields(t *testing.T) {
	truncateTables(t)

	token := &Token{
		UserId:         1,
		Key:            "sk-test-update-000000000000000000000000000000",
		Status:         common.TokenStatusEnabled,
		Name:           "Test Update Token",
		CreatedTime:    time.Now().Unix(),
		ExpiredTime:    -1,
		UnlimitedQuota: true,
		System:         "old-system",
		Team:           "old-team",
		ReviewComment:  "old comment",
	}
	require.NoError(t, DB.Create(token).Error)

	// Update the new fields
	token.System = "new-system"
	token.Team = "new-team"
	token.ReviewComment = "new comment"
	err := token.Update()
	require.NoError(t, err)

	// Read back and verify
	var reloaded Token
	require.NoError(t, DB.First(&reloaded, token.Id).Error)
	assert.Equal(t, "new-system", reloaded.System)
	assert.Equal(t, "new-team", reloaded.Team)
	assert.Equal(t, "new comment", reloaded.ReviewComment)
}

func TestTokenUpdate_DoesNotModifyIdOrKey(t *testing.T) {
	truncateTables(t)

	token := &Token{
		UserId:         1,
		Key:            "sk-test-idkey-0000000000000000000000000000000",
		Status:         common.TokenStatusEnabled,
		Name:           "Test ID Key Token",
		CreatedTime:    time.Now().Unix(),
		ExpiredTime:    -1,
		UnlimitedQuota: true,
		System:         "sys",
		Team:           "team",
		ReviewComment:  "ok",
	}
	require.NoError(t, DB.Create(token).Error)

	originalId := token.Id
	originalKey := token.Key

	token.System = "modified"
	err := token.Update()
	require.NoError(t, err)

	var reloaded Token
	require.NoError(t, DB.First(&reloaded, originalId).Error)
	assert.Equal(t, originalId, reloaded.Id)
	assert.Equal(t, originalKey, reloaded.Key)
}
