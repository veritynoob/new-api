package common

import "testing"

func TestTokenStatusConstants(t *testing.T) {
	// Verify existing constants are unchanged
	if TokenStatusEnabled != 1 {
		t.Errorf("TokenStatusEnabled = %d; want 1", TokenStatusEnabled)
	}
	if TokenStatusDisabled != 2 {
		t.Errorf("TokenStatusDisabled = %d; want 2", TokenStatusDisabled)
	}
	if TokenStatusExpired != 3 {
		t.Errorf("TokenStatusExpired = %d; want 3", TokenStatusExpired)
	}
	if TokenStatusExhausted != 4 {
		t.Errorf("TokenStatusExhausted = %d; want 4", TokenStatusExhausted)
	}

	// Verify new constants
	if TokenStatusPending != 5 {
		t.Errorf("TokenStatusPending = %d; want 5", TokenStatusPending)
	}
	if TokenStatusRejected != 6 {
		t.Errorf("TokenStatusRejected = %d; want 6", TokenStatusRejected)
	}
}

func TestTokenStatusDistinctValues(t *testing.T) {
	// Ensure all token status values are distinct
	values := map[int]bool{}
	statuses := []int{
		TokenStatusEnabled,
		TokenStatusDisabled,
		TokenStatusExpired,
		TokenStatusExhausted,
		TokenStatusPending,
		TokenStatusRejected,
	}
	for _, v := range statuses {
		if values[v] {
			t.Errorf("duplicate token status value: %d", v)
		}
		values[v] = true
	}
}
