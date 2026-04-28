package date

import "time"

func FormatDate(t time.Time) string {
	return t.Format("2006-01-02")
}
