package dto

import "testing"

func TestNotifyTypeConstants(t *testing.T) {
	// Verify existing constants are unchanged
	if NotifyTypeQuotaExceed != "quota_exceed" {
		t.Errorf("NotifyTypeQuotaExceed = %q; want %q", NotifyTypeQuotaExceed, "quota_exceed")
	}
	if NotifyTypeChannelUpdate != "channel_update" {
		t.Errorf("NotifyTypeChannelUpdate = %q; want %q", NotifyTypeChannelUpdate, "channel_update")
	}
	if NotifyTypeChannelTest != "channel_test" {
		t.Errorf("NotifyTypeChannelTest = %q; want %q", NotifyTypeChannelTest, "channel_test")
	}

	// Verify new constant
	if NotifyTypeTokenReviewed != "token_reviewed" {
		t.Errorf("NotifyTypeTokenReviewed = %q; want %q", NotifyTypeTokenReviewed, "token_reviewed")
	}
}

func TestNewNotifyWithTokenReviewed(t *testing.T) {
	n := NewNotify(NotifyTypeTokenReviewed, "Key Approved", "Your key has been approved", nil)
	if n.Type != "token_reviewed" {
		t.Errorf("Notify.Type = %q; want %q", n.Type, "token_reviewed")
	}
	if n.Title != "Key Approved" {
		t.Errorf("Notify.Title = %q; want %q", n.Title, "Key Approved")
	}
	if n.Content != "Your key has been approved" {
		t.Errorf("Notify.Content = %q; want %q", n.Content, "Your key has been approved")
	}
}
