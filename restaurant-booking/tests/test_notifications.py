from unittest.mock import patch

from src.models import Channel, NotifChannel, NotifType
from src.modules.notifications import dispatch_notification, resolve_channel


def test_web_booking_routes_to_sms():
    channel = resolve_channel(booked_via=Channel.web)
    assert channel == NotifChannel.sms


def test_phone_booking_routes_to_sms():
    channel = resolve_channel(booked_via=Channel.phone)
    assert channel == NotifChannel.sms


def test_whatsapp_booking_routes_to_whatsapp():
    channel = resolve_channel(booked_via=Channel.whatsapp)
    assert channel == NotifChannel.whatsapp


def test_line_booking_routes_to_line():
    channel = resolve_channel(booked_via=Channel.line)
    assert channel == NotifChannel.line


def test_messenger_booking_routes_to_messenger():
    channel = resolve_channel(booked_via=Channel.messenger)
    assert channel == NotifChannel.messenger


def test_dispatch_logs_notification(db, restaurant, table):
    from src.models import Booking, BookingStatus, Guest
    import uuid
    from datetime import date, time

    guest = Guest(id=uuid.uuid4(), restaurant_id=restaurant.id, name="Frank", phone="+66800000020", preferred_channel=Channel.web)
    db.add(guest)
    db.flush()
    booking = Booking(
        id=uuid.uuid4(), restaurant_id=restaurant.id,
        guest_id=guest.id, table_id=table.id,
        slot_date=date(2026, 4, 6), slot_start_time=time(12, 0),
        duration_minutes=90, party_size=2, status=BookingStatus.confirmed,
        booked_via=Channel.web, confirmation_code="RBK-7777",
    )
    db.add(booking)
    db.flush()

    with patch("src.modules.notifications._send_sms") as mock_sms:
        mock_sms.return_value = True
        dispatch_notification(db, booking=booking, notif_type=NotifType.confirmation)

    from src.models import NotificationLog, NotifStatus
    log = db.query(NotificationLog).filter(NotificationLog.booking_id == booking.id).first()
    assert log is not None
    assert log.status == NotifStatus.sent
    assert log.channel == NotifChannel.sms
